const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/pressdryer/mesin - Get all mesin pressdryer
router.get('/mesin', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM mesin_pressdryer ORDER BY nomor ASC'
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get mesin error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/pressdryer/core-available - Get CORE yang siap diproses
router.get('/core-available', authenticateToken, authorizeRoles('PRODUKSI'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT tb.*, s.nama as supplier_nama, g.nama as gudang_nama
      FROM transaksi_bahan tb
      LEFT JOIN suppliers s ON tb.supplier_id = s.id
      LEFT JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE tb.jenis = 'CORE' 
        AND tb.status = 'OK' 
        AND g.nama = 'Gudang A'
        AND tb.jumlah > 0
      ORDER BY tb.created_at ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get core available error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/pressdryer/process - Proses CORE ke Pressdryer
router.post('/process', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('mesin_id').isInt().withMessage('Mesin ID wajib diisi'),
  body('pallet_id').isInt().withMessage('Pallet ID wajib diisi'),
  body('jumlah_masuk').isFloat({ min: 0.01 }).withMessage('Jumlah masuk harus lebih dari 0'),
  body('hasil_ok').isFloat({ min: 0 }).withMessage('Hasil OK tidak valid'),
  body('hasil_reject').isFloat({ min: 0 }).withMessage('Hasil reject tidak valid'),
  body('keterangan').optional().trim()
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { mesin_id, pallet_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan } = req.body;

    // Validasi total hasil
    if (hasil_ok + hasil_reject > jumlah_masuk) {
      return res.status(400).json({ 
        error: 'Total hasil (OK + Reject) tidak boleh melebihi jumlah masuk' 
      });
    }

    await client.query('BEGIN');

    // Verifikasi pallet tersedia
    const palletCheck = await client.query(
      `SELECT * FROM transaksi_bahan 
       WHERE id = $1 AND jenis = 'CORE' AND status = 'OK' AND jumlah >= $2`,
      [pallet_id, jumlah_masuk]
    );

    if (palletCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Pallet tidak ditemukan atau jumlah tidak mencukupi' 
      });
    }

    // Kurangi jumlah dari Gudang A
    await client.query(
      'UPDATE transaksi_bahan SET jumlah = jumlah - $1 WHERE id = $2',
      [jumlah_masuk, pallet_id]
    );

    // Insert pressdryer log
    const logResult = await client.query(
      `INSERT INTO pressdryer_log 
       (mesin_id, pallet_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [mesin_id, pallet_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan, req.user.id]
    );

    // Jika ada hasil OK, masukkan ke Gudang B
    if (hasil_ok > 0) {
      const gudangBResult = await client.query(
        "SELECT id FROM gudang WHERE nama = 'Gudang B' LIMIT 1"
      );

      if (gudangBResult.rows.length > 0) {
        const gudangBId = gudangBResult.rows[0].id;
        const palletData = palletCheck.rows[0];

        await client.query(
          `INSERT INTO transaksi_bahan 
           (supplier_id, jenis, ketebalan, jumlah, satuan, lokasi_gudang_id, status, keterangan, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, 'OK', $7, $8)`,
          [
            palletData.supplier_id,
            'CORE',
            palletData.ketebalan,
            hasil_ok,
            palletData.satuan,
            gudangBId,
            `Hasil Pressdryer Mesin ${mesin_id}`,
            req.user.id
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Proses pressdryer berhasil dicatat',
      data: logResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process pressdryer error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/pressdryer/logs - Get pressdryer logs
router.get('/logs', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, mesin_id } = req.query;

    let query = `
      SELECT pl.*, 
             m.nama as mesin_nama, 
             m.nomor as mesin_nomor,
             tb.jenis as bahan_jenis,
             tb.ketebalan as bahan_ketebalan,
             u.username as operator
      FROM pressdryer_log pl
      LEFT JOIN mesin_pressdryer m ON pl.mesin_id = m.id
      LEFT JOIN transaksi_bahan tb ON pl.pallet_id = tb.id
      LEFT JOIN users u ON pl.user_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND DATE(pl.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(pl.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (mesin_id) {
      query += ` AND pl.mesin_id = $${paramCount}`;
      params.push(mesin_id);
      paramCount++;
    }

    query += ' ORDER BY pl.created_at DESC';

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get pressdryer logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;