const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/bahan - Get all bahan baku
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, jenis, gudang_id } = req.query;
    
    let query = `
      SELECT tb.*, s.nama as supplier_nama, g.nama as gudang_nama, u.username as input_by
      FROM transaksi_bahan tb
      LEFT JOIN suppliers s ON tb.supplier_id = s.id
      LEFT JOIN gudang g ON tb.lokasi_gudang_id = g.id
      LEFT JOIN users u ON tb.user_id = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND tb.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (jenis) {
      query += ` AND tb.jenis = $${paramCount}`;
      params.push(jenis);
      paramCount++;
    }

    if (gudang_id) {
      query += ` AND tb.lokasi_gudang_id = $${paramCount}`;
      params.push(gudang_id);
      paramCount++;
    }

    query += ' ORDER BY tb.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get bahan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bahan/:id - Get bahan by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT tb.*, s.nama as supplier_nama, g.nama as gudang_nama, u.username as input_by
       FROM transaksi_bahan tb
       LEFT JOIN suppliers s ON tb.supplier_id = s.id
       LEFT JOIN gudang g ON tb.lokasi_gudang_id = g.id
       LEFT JOIN users u ON tb.user_id = u.id
       WHERE tb.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bahan tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get bahan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/bahan - Input bahan baku masuk (PPIC only)
router.post('/', authenticateToken, authorizeRoles('PPIC'), [
  body('supplier_id').isInt().withMessage('Supplier ID wajib diisi'),
  body('jenis').isIn(['CORE', 'FACE', 'BACK', 'LONGCORE', 'LEM']).withMessage('Jenis bahan tidak valid'),
  body('ketebalan').optional().isFloat({ min: 0 }),
  body('jumlah').isFloat({ min: 0.01 }).withMessage('Jumlah harus lebih dari 0'),
  body('satuan').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { supplier_id, jenis, ketebalan, jumlah, satuan, keterangan } = req.body;

    // Get Gudang A ID
    const gudangResult = await db.query(
      "SELECT id FROM gudang WHERE nama = 'Gudang A' LIMIT 1"
    );

    if (gudangResult.rows.length === 0) {
      return res.status(500).json({ error: 'Gudang A tidak ditemukan' });
    }

    const gudangAId = gudangResult.rows[0].id;

    const result = await db.query(
      `INSERT INTO transaksi_bahan 
       (supplier_id, jenis, ketebalan, jumlah, satuan, lokasi_gudang_id, status, keterangan, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6, 'MENUNGGU QC', $7, $8) 
       RETURNING *`,
      [supplier_id, jenis, ketebalan || null, jumlah, satuan || 'lembar', gudangAId, keterangan || null, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Bahan baku berhasil ditambahkan ke Gudang A',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create bahan error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/bahan/stok/summary - Get stok summary per gudang
router.get('/stok/summary', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        g.id as gudang_id,
        g.nama as gudang_nama,
        tb.jenis,
        tb.ketebalan,
        SUM(tb.jumlah) as total_jumlah,
        tb.satuan,
        COUNT(*) as total_transaksi
      FROM transaksi_bahan tb
      JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE tb.status != 'REJECT'
      GROUP BY g.id, g.nama, tb.jenis, tb.ketebalan, tb.satuan
      ORDER BY g.nama, tb.jenis, tb.ketebalan
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get stok summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;