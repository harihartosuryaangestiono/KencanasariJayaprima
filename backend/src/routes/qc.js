const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/qc/pending - Get bahan yang menunggu QC di Gudang A
router.get('/pending', authenticateToken, authorizeRoles('PRODUKSI'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT tb.*, s.nama as supplier_nama, g.nama as gudang_nama
      FROM transaksi_bahan tb
      LEFT JOIN suppliers s ON tb.supplier_id = s.id
      LEFT JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE tb.status = 'MENUNGGU QC' AND g.nama = 'Gudang A'
      ORDER BY tb.created_at ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get pending QC error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/qc/:id/approve - Approve QC (OK)
router.put('/:id/approve', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('keterangan').optional().trim()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { keterangan } = req.body;

    const result = await db.query(
      `UPDATE transaksi_bahan 
       SET status = 'OK', 
           keterangan = COALESCE($1, keterangan),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'MENUNGGU QC'
       RETURNING *`,
      [keterangan, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bahan tidak ditemukan atau sudah di-QC' });
    }

    res.json({
      success: true,
      message: 'QC Approved - Bahan tetap di Gudang A dengan status OK',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Approve QC error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/qc/:id/reject - Reject QC
router.put('/:id/reject', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('keterangan').notEmpty().withMessage('Keterangan reject wajib diisi')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { keterangan } = req.body;

    const result = await db.query(
      `UPDATE transaksi_bahan 
       SET status = 'REJECT', 
           keterangan = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'MENUNGGU QC'
       RETURNING *`,
      [keterangan, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bahan tidak ditemukan atau sudah di-QC' });
    }

    res.json({
      success: true,
      message: 'Bahan di-reject',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Reject QC error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/qc/batch - Batch QC (approve/reject multiple items)
router.put('/batch', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('items').isArray().withMessage('Items harus berupa array'),
  body('items.*.id').isInt().withMessage('ID tidak valid'),
  body('items.*.status').isIn(['OK', 'REJECT']).withMessage('Status harus OK atau REJECT'),
  body('items.*.keterangan').optional().trim()
], async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { items } = req.body;

    await client.query('BEGIN');

    const results = [];
    for (const item of items) {
      const result = await client.query(
        `UPDATE transaksi_bahan 
         SET status = $1, 
             keterangan = COALESCE($2, keterangan),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3 AND status = 'MENUNGGU QC'
         RETURNING *`,
        [item.status, item.keterangan, item.id]
      );

      if (result.rows.length > 0) {
        results.push(result.rows[0]);
      }
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${results.length} bahan berhasil di-QC`,
      data: results
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Batch QC error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

module.exports = router;