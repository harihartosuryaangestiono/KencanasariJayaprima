const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// GET /api/laporan/export/faceback - Export Laporan Face & Back ke Excel
// IMPORTANT: This route must be BEFORE /faceback to avoid routing conflicts
router.get('/export/faceback', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        tb.created_at::date as tanggal,
        'FACE & BACK' as jenis,
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
      query += ` AND tb.created_at::date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND tb.created_at::date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY tb.created_at::date ORDER BY tanggal DESC`;

    const result = await db.query(query, params);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Laporan Face & Back');

    // Set columns
    worksheet.columns = [
      { header: 'Tanggal', key: 'tanggal', width: 15 },
      { header: 'Jenis', key: 'jenis', width: 10 },
      { header: 'Face (lembar)', key: 'face_jumlah', width: 15 },
      { header: 'Back (lembar)', key: 'back_jumlah', width: 15 },
      { header: 'OK', key: 'ok_jumlah', width: 12 },
      { header: 'Reject', key: 'reject_jumlah', width: 12 },
      { header: 'Total', key: 'total', width: 15 }
    ];

    // Add data rows
    const rows = result.rows.map(row => ({
      tanggal: row.tanggal ? new Date(row.tanggal).toLocaleDateString('id-ID') : '-',
      jenis: row.jenis || '-',
      face_jumlah: parseFloat(row.face_jumlah || 0),
      back_jumlah: parseFloat(row.back_jumlah || 0),
      ok_jumlah: parseFloat(row.ok_jumlah || 0),
      reject_jumlah: parseFloat(row.reject_jumlah || 0),
      total: parseFloat(row.face_jumlah || 0) + parseFloat(row.back_jumlah || 0)
    }));

    worksheet.addRows(rows);

    // Add summary row
    if (rows.length > 0) {
      const totalFace = rows.reduce((sum, row) => sum + row.face_jumlah, 0);
      const totalBack = rows.reduce((sum, row) => sum + row.back_jumlah, 0);
      const totalOk = rows.reduce((sum, row) => sum + row.ok_jumlah, 0);
      const totalReject = rows.reduce((sum, row) => sum + row.reject_jumlah, 0);
      const grandTotal = totalFace + totalBack;

      worksheet.addRow({
        tanggal: 'TOTAL',
        jenis: '',
        face_jumlah: totalFace,
        back_jumlah: totalBack,
        ok_jumlah: totalOk,
        reject_jumlah: totalReject,
        total: grandTotal
      });

      // Style summary row
      const summaryRow = worksheet.getRow(rows.length + 2);
      summaryRow.font = { bold: true };
      summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF0F0F0' }
      };
    }

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Set response headers
    const fileName = `Laporan_FaceBack_${start_date || 'all'}_${end_date || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export faceback error:', error);
    console.error('Error stack:', error.stack);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: 'Gagal melakukan export excel',
        message: error.message 
      });
    }
  }
});

// GET /api/laporan/faceback - Laporan Face & Back
router.get('/faceback', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = `
      SELECT 
        tb.created_at::date as tanggal,
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
      query += ` AND tb.created_at::date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND tb.created_at::date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY tb.created_at::date, tb.jenis ORDER BY tanggal DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan faceback error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message 
    });
  }
});

// GET /api/laporan/pressdryer - Laporan Pressdryer
router.get('/pressdryer', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, mesin_id } = req.query;

    let query = `
      SELECT 
        pl.created_at::date as tanggal,
        m.nomor as mesin_nomor,
        m.nama as mesin_nama,
        COUNT(DISTINCT pl.pallet_id) as pallet_masuk,
        COALESCE(SUM(pl.jumlah_masuk), 0) as total_masuk,
        COALESCE(SUM(pl.hasil_ok), 0) as total_ok,
        COALESCE(SUM(pl.hasil_reject), 0) as total_reject,
        ROUND((SUM(pl.hasil_ok) / NULLIF(SUM(pl.jumlah_masuk), 0) * 100), 2) as persentase_ok
      FROM pressdryer_log pl
      JOIN mesin_pressdryer m ON pl.mesin_id = m.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND pl.created_at::date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND pl.created_at::date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    if (mesin_id) {
      query += ` AND pl.mesin_id = $${paramCount}`;
      params.push(mesin_id);
      paramCount++;
    }

    query += ` GROUP BY pl.created_at::date, m.nomor, m.nama ORDER BY tanggal DESC, m.nomor`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan pressdryer error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message 
    });
  }
});

// GET /api/laporan/penggunaan-lem - Laporan Penggunaan Lem
router.get('/penggunaan-lem', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // Query untuk mendapatkan penggunaan lem dari setting_plywood
    // dan total produksi dari hotpress_log (jika ada)
    let query = `
      SELECT 
        sp.created_at::date as tanggal,
        sp.tipe_plywood,
        COALESCE(SUM(sp.lem_qty), 0) as total_lem,
        COALESCE(SUM(COALESCE(hl.hasil_ok, 0)), 0) as total_produksi,
        COUNT(DISTINCT sp.id) as jumlah_setting,
        CASE 
          WHEN SUM(COALESCE(hl.hasil_ok, 0)) > 0 
          THEN ROUND(SUM(sp.lem_qty) / NULLIF(SUM(COALESCE(hl.hasil_ok, 0)), 0), 2)
          ELSE 0 
        END as lem_per_unit
      FROM setting_plywood sp
      LEFT JOIN hotpress_log hl ON sp.id = hl.setting_plywood_id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND sp.created_at::date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND sp.created_at::date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY sp.created_at::date, sp.tipe_plywood ORDER BY tanggal DESC`;

    const result = await db.query(query, params);
    
    // Format tanggal untuk konsistensi
    const formattedData = result.rows.map(row => ({
      ...row,
      tanggal: row.tanggal ? new Date(row.tanggal).toISOString().split('T')[0] : null,
      total_lem: parseFloat(row.total_lem || 0),
      total_produksi: parseFloat(row.total_produksi || 0),
      jumlah_setting: parseInt(row.jumlah_setting || 0),
      lem_per_unit: parseFloat(row.lem_per_unit || 0)
    }));
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error('Laporan penggunaan lem error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message 
    });
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
        fg.created_at::date as tanggal,
        fg.tipe_plywood,
        fg.grading,
        COALESCE(SUM(fg.jumlah), 0) as total_jumlah,
        fg.status,
        COUNT(*) as jumlah_batch
      FROM finished_goods fg
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND fg.created_at::date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }

    if (end_date) {
      query += ` AND fg.created_at::date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }

    query += ` GROUP BY fg.created_at::date, fg.tipe_plywood, fg.grading, fg.status 
               ORDER BY tanggal DESC`;

    const result = await db.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Laporan finished goods error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message 
    });
  }
});

// GET /api/laporan/export/pressdryer - Export Laporan Pressdryer ke Excel
router.get('/export/pressdryer', authenticateToken, async (req, res) => {
  try {
    const { start_date, end_date, mesin_id } = req.query;

    let query = `
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
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (start_date) {
      query += ` AND pl.created_at::date >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    } else {
      query += ` AND pl.created_at::date >= '2000-01-01'::date`;
    }

    if (end_date) {
      query += ` AND pl.created_at::date <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    } else {
      query += ` AND pl.created_at::date <= CURRENT_DATE`;
    }

    if (mesin_id) {
      query += ` AND pl.mesin_id = $${paramCount}`;
      params.push(mesin_id);
      paramCount++;
    }

    query += ` ORDER BY pl.created_at DESC`;

    const result = await db.query(query, params);

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

    // Set response headers
    const fileName = `Laporan_Pressdryer_${start_date || 'all'}_${end_date || 'all'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export pressdryer error:', error);
    console.error('Error stack:', error.stack);
    
    // Only send JSON error if response hasn't been sent
    if (!res.headersSent) {
      res.status(500).json({ 
        success: false,
        error: 'Gagal melakukan export excel',
        message: error.message 
      });
    }
  }
});

module.exports = router;