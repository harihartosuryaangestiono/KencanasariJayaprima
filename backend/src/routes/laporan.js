const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// GET /api/laporan/faceback - Laporan Face & Back
router.get('/faceback', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        DATE(tb.created_at) as tanggal,
        tb.jenis,
        SUM(CASE WHEN tb.jenis = 'FACE' THEN tb.jumlah ELSE 0 END) as face_jumlah,
        SUM(CASE WHEN tb.jenis = 'BACK' THEN tb.jumlah ELSE 0 END) as back_jumlah,
        SUM(CASE WHEN tb.status = 'OK' THEN tb.jumlah ELSE 0 END) as ok_jumlah,
        SUM(CASE WHEN tb.status = 'REJECT' THEN tb.jumlah ELSE 0 END) as reject_jumlah
      FROM transaksi_bahan tb
      WHERE tb.jenis IN ('FACE', 'BACK')
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND DATE(tb.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(tb.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY DATE(tb.created_at), tb.jenis ORDER BY tanggal DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan faceback error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/laporan/pressdryer - Laporan Pressdryer
router.get('/pressdryer', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, mesin_id } = req.query;

    let query = `
      SELECT 
        DATE(pl.created_at) as tanggal,
        m.nomor as mesin_nomor,
        m.nama as mesin_nama,
        COUNT(DISTINCT pl.pallet_id) as pallet_masuk,
        SUM(pl.jumlah_masuk) as total_masuk,
        SUM(pl.hasil_ok) as total_ok,
        SUM(pl.hasil_reject) as total_reject,
        ROUND((SUM(pl.hasil_ok) / NULLIF(SUM(pl.jumlah_masuk), 0) * 100), 2) as persentase_ok
      FROM pressdryer_log pl
      JOIN mesin_pressdryer m ON pl.mesin_id = m.id
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

    query += ` GROUP BY DATE(pl.created_at), m.nomor, m.nama ORDER BY tanggal DESC, m.nomor`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan pressdryer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/laporan/penggunaan-lem - Laporan Penggunaan Lem
router.get('/penggunaan-lem', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        DATE(sp.created_at) as tanggal,
        sp.tipe_plywood,
        SUM(sp.lem_qty) as total_lem,
        SUM(sp.hasil_ok) as total_produksi,
        COUNT(*) as jumlah_setting,
        ROUND(SUM(sp.lem_qty) / NULLIF(SUM(sp.hasil_ok), 0), 2) as lem_per_unit
      FROM setting_plywood sp
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND DATE(sp.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(sp.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY DATE(sp.created_at), sp.tipe_plywood ORDER BY tanggal DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan penggunaan lem error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/laporan/stok-gudang - Laporan Stok per Gudang
router.get('/stok-gudang', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        g.id as gudang_id,
        g.nama as gudang_nama,
        tb.jenis,
        tb.ketebalan,
        tb.satuan,
        SUM(tb.jumlah) as total_stok,
        COUNT(*) as jumlah_batch,
        tb.status
      FROM transaksi_bahan tb
      JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE tb.jumlah > 0
      GROUP BY g.id, g.nama, tb.jenis, tb.ketebalan, tb.satuan, tb.status
      ORDER BY g.nama, tb.jenis, tb.ketebalan
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan stok gudang error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/laporan/finished-goods - Laporan Barang Jadi
router.get('/finished-goods', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        DATE(fg.created_at) as tanggal,
        fg.tipe_plywood,
        fg.grading,
        SUM(fg.jumlah) as total_jumlah,
        fg.status,
        COUNT(*) as jumlah_batch
      FROM finished_goods fg
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND DATE(fg.created_at) >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND DATE(fg.created_at) <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY DATE(fg.created_at), fg.tipe_plywood, fg.grading, fg.status 
               ORDER BY tanggal DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan finished goods error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/laporan/export/pressdryer - Export Laporan Pressdryer ke Excel
router.get('/export/pressdryer', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    const query = `
      SELECT 
        TO_CHAR(pl.created_at, 'YYYY-MM-DD') as tanggal,
        TO_CHAR(pl.created_at, 'HH24:MI') as waktu,
        m.nomor as mesin_nomor,
        m.nama as mesin_nama,
        tb.ketebalan,
        pl.jumlah_masuk,
        pl.hasil_ok,
        pl.hasil_reject,
        ROUND((pl.hasil_ok / NULLIF(pl.jumlah_masuk, 0) * 100), 2) as persentase_ok,
        pl.keterangan,
        u.username as operator
      FROM pressdryer_log pl
      JOIN mesin_pressdryer m ON pl.mesin_id = m.id
      LEFT JOIN transaksi_bahan tb ON pl.pallet_id = tb.id
      LEFT JOIN users u ON pl.user_id = u.id
      WHERE DATE(pl.created_at) BETWEEN COALESCE($1, '2000-01-01') AND COALESCE($2, CURRENT_DATE)
      ORDER BY pl.created_at DESC
    `;

    const result = await db.query(query, [start_date, end_date]);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Pressdryer');

    worksheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 12 },
      { header: 'Waktu', key: 'waktu', width: 10 },
      { header: 'Mesin', key: 'mesin_nomor', width: 8 },
      { header: 'Nama Mesin', key: 'mesin_nama', width: 15 },
      { header: 'Ketebalan', key: 'ketebalan', width: 10 },
      { header: 'Jumlah Masuk', key: 'jumlah_masuk', width: 12 },
      { header: 'Hasil OK', key: 'hasil_ok', width: 12 },
      { header: 'Hasil Reject', key: 'hasil_reject', width: 12 },
      { header: '% OK', key: 'persentase_ok', width: 10 },
      { header: 'Operator', key: 'operator', width: 15 },
      { header: 'Keterangan', key: 'keterangan', width: 30 }
    ];

    worksheet.addRows(result.rows);

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=Laporan_Pressdryer_${new Date().toISOString().split('T')[0]}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export pressdryer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;