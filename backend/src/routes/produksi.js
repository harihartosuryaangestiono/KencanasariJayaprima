const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST /api/produksi/repair - Proses Repair
router.post('/repair', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('bahan_id').isInt().withMessage('Bahan ID wajib diisi'),
  body('jumlah_masuk').isFloat({ min: 0.01 }).withMessage('Jumlah masuk harus lebih dari 0'),
  body('hasil_ok').isFloat({ min: 0 }).withMessage('Hasil OK tidak valid'),
  body('hasil_reject').isFloat({ min: 0 }).withMessage('Hasil reject tidak valid')
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bahan_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan } = req.body;

    await client.query('BEGIN');

    // Verifikasi bahan tersedia di Gudang B
    const bahanCheck = await client.query(
      `SELECT tb.*, g.nama as gudang_nama 
       FROM transaksi_bahan tb
       JOIN gudang g ON tb.lokasi_gudang_id = g.id
       WHERE tb.id = $1 AND g.nama = 'Gudang B' AND tb.status = 'OK' AND tb.jumlah >= $2`,
      [bahan_id, jumlah_masuk]
    );

    if (bahanCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Bahan tidak ditemukan di Gudang B atau jumlah tidak mencukupi' 
      });
    }

    // Insert repair log
    const result = await client.query(
      `INSERT INTO repair_log (bahan_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [bahan_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan, req.user.id]
    );

    // Update jumlah bahan di Gudang B
    await client.query(
      'UPDATE transaksi_bahan SET jumlah = jumlah - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [jumlah_masuk, bahan_id]
    );

    // Jika ada hasil OK, pindah ke Gudang C
    if (hasil_ok > 0) {
      const bahanData = bahanCheck.rows[0];
      const gudangC = await client.query("SELECT id FROM gudang WHERE nama = 'Gudang C' LIMIT 1");

      if (gudangC.rows.length > 0) {
        await client.query(
          `INSERT INTO transaksi_bahan 
           (supplier_id, jenis, ketebalan, jumlah, satuan, lokasi_gudang_id, status, keterangan, user_id)
           VALUES ($1, $2, $3, $4, $5, $6, 'OK', 'Hasil Repair', $7)`,
          [
            bahanData.supplier_id,
            bahanData.jenis,
            bahanData.ketebalan,
            hasil_ok,
            bahanData.satuan,
            gudangC.rows[0].id,
            req.user.id
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Proses repair berhasil dicatat',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Repair error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/produksi/core-builder - Proses Core Builder 4x4
router.post('/core-builder', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('bahan_id').isInt().withMessage('Bahan ID wajib diisi'),
  body('jumlah_masuk').isFloat({ min: 0.01 }),
  body('hasil_4x4').isFloat({ min: 0 }),
  body('hasil_reject').isFloat({ min: 0 })
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bahan_id, jumlah_masuk, hasil_4x4, hasil_reject, keterangan } = req.body;

    await client.query('BEGIN');

    // Verifikasi bahan CORE tersedia di Gudang B
    const bahanCheck = await client.query(
      `SELECT tb.*, g.nama as gudang_nama 
       FROM transaksi_bahan tb
       JOIN gudang g ON tb.lokasi_gudang_id = g.id
       WHERE tb.id = $1 AND tb.jenis = 'CORE' AND g.nama = 'Gudang B' AND tb.status = 'OK' AND tb.jumlah >= $2`,
      [bahan_id, jumlah_masuk]
    );

    if (bahanCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Bahan CORE tidak ditemukan di Gudang B atau jumlah tidak mencukupi' 
      });
    }

    const result = await client.query(
      `INSERT INTO core_builder_log (bahan_id, jumlah_masuk, hasil_4x4, hasil_reject, keterangan, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [bahan_id, jumlah_masuk, hasil_4x4, hasil_reject, keterangan, req.user.id]
    );

    await client.query(
      'UPDATE transaksi_bahan SET jumlah = jumlah - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [jumlah_masuk, bahan_id]
    );

    if (hasil_4x4 > 0) {
      const bahanData = bahanCheck.rows[0];
      const gudangC = await client.query("SELECT id FROM gudang WHERE nama = 'Gudang C' LIMIT 1");

      if (gudangC.rows.length > 0) {
        await client.query(
          `INSERT INTO transaksi_bahan 
           (supplier_id, jenis, ketebalan, jumlah, satuan, lokasi_gudang_id, status, keterangan, user_id)
           VALUES ($1, 'CORE', $2, $3, $4, $5, 'OK', 'Hasil Core Builder 4x4', $6)`,
          [
            bahanData.supplier_id,
            bahanData.ketebalan,
            hasil_4x4,
            bahanData.satuan,
            gudangC.rows[0].id,
            req.user.id
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Proses core builder berhasil dicatat',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Core builder error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/produksi/scraff-join - Proses Scraff Join 4x4
router.post('/scraff-join', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('bahan_id').isInt(),
  body('jumlah_masuk').isFloat({ min: 0.01 }),
  body('hasil_4x4').isFloat({ min: 0 }),
  body('hasil_reject').isFloat({ min: 0 }),
  body('arah_serat').optional().trim()
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { bahan_id, jumlah_masuk, hasil_4x4, hasil_reject, arah_serat, keterangan } = req.body;

    await client.query('BEGIN');

    // Verifikasi bahan CORE tersedia di Gudang B
    const bahanCheck = await client.query(
      `SELECT tb.*, g.nama as gudang_nama 
       FROM transaksi_bahan tb
       JOIN gudang g ON tb.lokasi_gudang_id = g.id
       WHERE tb.id = $1 AND tb.jenis = 'CORE' AND g.nama = 'Gudang B' AND tb.status = 'OK' AND tb.jumlah >= $2`,
      [bahan_id, jumlah_masuk]
    );

    if (bahanCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Bahan CORE tidak ditemukan di Gudang B atau jumlah tidak mencukupi' 
      });
    }

    const result = await client.query(
      `INSERT INTO scraff_join_log 
       (bahan_id, jumlah_masuk, hasil_4x4, hasil_reject, arah_serat, keterangan, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [bahan_id, jumlah_masuk, hasil_4x4, hasil_reject, arah_serat, keterangan, req.user.id]
    );

    await client.query(
      'UPDATE transaksi_bahan SET jumlah = jumlah - $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [jumlah_masuk, bahan_id]
    );

    if (hasil_4x4 > 0) {
      const bahanData = bahanCheck.rows[0];
      const gudangC = await client.query("SELECT id FROM gudang WHERE nama = 'Gudang C' LIMIT 1");

      if (gudangC.rows.length > 0) {
        await client.query(
          `INSERT INTO transaksi_bahan 
           (supplier_id, jenis, ketebalan, jumlah, satuan, lokasi_gudang_id, status, keterangan, user_id)
           VALUES ($1, 'CORE', $2, $3, $4, $5, 'OK', 'Hasil Scraff Join 4x4 - Arah Serat Dibalik', $6)`,
          [
            bahanData.supplier_id,
            bahanData.ketebalan,
            hasil_4x4,
            bahanData.satuan,
            gudangC.rows[0].id,
            req.user.id
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Proses scraff join berhasil dicatat',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Scraff join error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/produksi/setting-plywood - Setting Plywood (kombinasi bahan)
router.post('/setting-plywood', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('tipe_plywood').isIn(['3MM', '9MM', '29MM']).withMessage('Tipe plywood tidak valid'),
  body('shortcore_qty').isFloat({ min: 0 }),
  body('longcore_qty').optional().isFloat({ min: 0 }),
  body('face_qty').isFloat({ min: 0 }),
  body('back_qty').isFloat({ min: 0 }),
  body('lem_qty').isFloat({ min: 0 }),
  body('hasil_ok').optional().isFloat({ min: 0 }),
  body('hasil_reject').optional().isFloat({ min: 0 })
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      tipe_plywood, shortcore_qty, longcore_qty, face_qty, back_qty, 
      lem_qty, hasil_ok, hasil_reject, keterangan 
    } = req.body;

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO setting_plywood 
       (tipe_plywood, shortcore_qty, longcore_qty, face_qty, back_qty, lem_qty, 
        hasil_ok, hasil_reject, keterangan, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        tipe_plywood, shortcore_qty, longcore_qty || 0, face_qty, back_qty, 
        lem_qty, hasil_ok || 0, hasil_reject || 0, keterangan, req.user.id
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Setting plywood berhasil dicatat',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Setting plywood error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// POST /api/produksi/hotpress - Proses Hotpress
router.post('/hotpress', authenticateToken, authorizeRoles('PRODUKSI'), [
  body('setting_plywood_id').isInt(),
  body('jumlah_masuk').isFloat({ min: 0.01 }),
  body('hasil_ok').isFloat({ min: 0 }),
  body('hasil_reject').isFloat({ min: 0 })
], async (req, res) => {
  const client = await db.pool.connect();

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { setting_plywood_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan } = req.body;

    await client.query('BEGIN');

    // Verifikasi setting plywood exists
    const settingCheck = await client.query(
      'SELECT * FROM setting_plywood WHERE id = $1',
      [setting_plywood_id]
    );

    if (settingCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Setting plywood tidak ditemukan' 
      });
    }

    const result = await client.query(
      `INSERT INTO hotpress_log 
       (setting_plywood_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan, user_id)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [setting_plywood_id, jumlah_masuk, hasil_ok, hasil_reject, keterangan, req.user.id]
    );

    // Jika ada hasil OK, masukkan ke Finished Goods
    if (hasil_ok > 0) {
      const settingData = settingCheck.rows[0];
      
      const gudangFinished = await client.query(
        "SELECT id FROM gudang WHERE nama = 'Gudang Finished' LIMIT 1"
      );

      if (gudangFinished.rows.length > 0) {
        await client.query(
          `INSERT INTO finished_goods 
           (tipe_plywood, jumlah, grading, hotpress_log_id, lokasi_gudang_id, user_id)
           VALUES ($1, $2, 'A', $3, $4, $5)`,
          [
            settingData.tipe_plywood,
            hasil_ok,
            result.rows[0].id,
            gudangFinished.rows[0].id,
            req.user.id
          ]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Proses hotpress berhasil dicatat. Hasil OK masuk ke Gudang Finished!',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Hotpress error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/produksi/gudang-b - Get bahan di Gudang B
router.get('/gudang-b', authenticateToken, authorizeRoles('PRODUKSI'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT tb.*, s.nama as supplier_nama, g.nama as gudang_nama
      FROM transaksi_bahan tb
      LEFT JOIN suppliers s ON tb.supplier_id = s.id
      LEFT JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE g.nama = 'Gudang B' AND tb.status = 'OK' AND tb.jumlah > 0
      ORDER BY tb.created_at ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get Gudang B error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/produksi/gudang-c - Get bahan di Gudang C
router.get('/gudang-c', authenticateToken, authorizeRoles('PRODUKSI'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT tb.*, s.nama as supplier_nama, g.nama as gudang_nama
      FROM transaksi_bahan tb
      LEFT JOIN suppliers s ON tb.supplier_id = s.id
      LEFT JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE g.nama = 'Gudang C' AND tb.status = 'OK' AND tb.jumlah > 0
      ORDER BY tb.jenis, tb.ketebalan, tb.created_at ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get Gudang C error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/produksi/setting-plywood-list - Get list setting plywood (untuk Hotpress)
router.get('/setting-plywood-list', authenticateToken, authorizeRoles('PRODUKSI'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT sp.*, u.username as operator
      FROM setting_plywood sp
      LEFT JOIN users u ON sp.user_id = u.id
      ORDER BY sp.created_at DESC
      LIMIT 50
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get setting plywood list error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/produksi/logs/:type - Get logs by type
router.get('/logs/:type', authenticateToken, authorizeRoles('PRODUKSI', 'BOS'), async (req, res) => {
  try {
    const { type } = req.params;
    const { start_date, end_date, limit = 50 } = req.query;

    let query = '';
    const params = [];
    let paramCount = 1;

    switch (type) {
      case 'repair':
        query = `
          SELECT rl.*, tb.jenis, tb.ketebalan, s.nama as supplier_nama, u.username as operator
          FROM repair_log rl
          LEFT JOIN transaksi_bahan tb ON rl.bahan_id = tb.id
          LEFT JOIN suppliers s ON tb.supplier_id = s.id
          LEFT JOIN users u ON rl.user_id = u.id
          WHERE 1=1
        `;
        break;
      
      case 'core-builder':
        query = `
          SELECT cbl.*, tb.jenis, tb.ketebalan, s.nama as supplier_nama, u.username as operator
          FROM core_builder_log cbl
          LEFT JOIN transaksi_bahan tb ON cbl.bahan_id = tb.id
          LEFT JOIN suppliers s ON tb.supplier_id = s.id
          LEFT JOIN users u ON cbl.user_id = u.id
          WHERE 1=1
        `;
        break;
      
      case 'scraff-join':
        query = `
          SELECT sjl.*, tb.jenis, tb.ketebalan, s.nama as supplier_nama, u.username as operator
          FROM scraff_join_log sjl
          LEFT JOIN transaksi_bahan tb ON sjl.bahan_id = tb.id
          LEFT JOIN suppliers s ON tb.supplier_id = s.id
          LEFT JOIN users u ON sjl.user_id = u.id
          WHERE 1=1
        `;
        break;
      
      case 'hotpress':
        query = `
          SELECT hl.*, sp.tipe_plywood, u.username as operator
          FROM hotpress_log hl
          LEFT JOIN setting_plywood sp ON hl.setting_plywood_id = sp.id
          LEFT JOIN users u ON hl.user_id = u.id
          WHERE 1=1
        `;
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid log type' });
    }

    if (start_date) {
      query += ` AND DATE(${type === 'hotpress' ? 'hl' : type === 'repair' ? 'rl' : type === 'core-builder' ? 'cbl' : 'sjl'}.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(${type === 'hotpress' ? 'hl' : type === 'repair' ? 'rl' : type === 'core-builder' ? 'cbl' : 'sjl'}.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
    params.push(limit);

    const result = await db.query(query, params);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get logs error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;