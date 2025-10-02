const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/summary - Dashboard Summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    // Total stok per gudang
    const stokGudang = await db.query(`
      SELECT 
        g.nama as gudang,
        COUNT(DISTINCT tb.id) as total_batch,
        SUM(tb.jumlah) as total_jumlah
      FROM transaksi_bahan tb
      JOIN gudang g ON tb.lokasi_gudang_id = g.id
      WHERE tb.jumlah > 0 AND tb.status != 'REJECT'
      GROUP BY g.nama
      ORDER BY g.id
    `);

    // Bahan menunggu QC
    const menungguQC = await db.query(`
      SELECT COUNT(*) as count
      FROM transaksi_bahan
      WHERE status = 'MENUNGGU QC'
    `);

    // Produksi hari ini
    const produksiHariIni = await db.query(`
      SELECT 
        COUNT(*) as total_produksi,
        SUM(jumlah) as total_jumlah
      FROM finished_goods
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // Pressdryer aktif hari ini
    const pressdryerAktif = await db.query(`
      SELECT 
        COUNT(DISTINCT mesin_id) as mesin_aktif,
        SUM(jumlah_masuk) as total_proses,
        SUM(hasil_ok) as total_ok,
        SUM(hasil_reject) as total_reject
      FROM pressdryer_log
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // Penggunaan lem hari ini
    const lemHariIni = await db.query(`
      SELECT SUM(lem_qty) as total_lem
      FROM setting_plywood
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // Chart data - Produksi 7 hari terakhir
    const produksi7Hari = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as tanggal,
        tipe_plywood,
        SUM(jumlah) as total
      FROM finished_goods
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), tipe_plywood
      ORDER BY tanggal DESC
    `);

    // Top suppliers
    const topSuppliers = await db.query(`
      SELECT 
        s.nama,
        COUNT(tb.id) as total_transaksi,
        SUM(tb.jumlah) as total_jumlah
      FROM suppliers s
      LEFT JOIN transaksi_bahan tb ON s.id = tb.supplier_id
      WHERE tb.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY s.id, s.nama
      ORDER BY total_transaksi DESC
      LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        stok_gudang: stokGudang.rows,
        menunggu_qc: parseInt(menungguQC.rows[0].count),
        produksi_hari_ini: {
          total: parseInt(produksiHariIni.rows[0]?.total_produksi || 0),
          jumlah: parseFloat(produksiHariIni.rows[0]?.total_jumlah || 0)
        },
        pressdryer_aktif: {
          mesin: parseInt(pressdryerAktif.rows[0]?.mesin_aktif || 0),
          total_proses: parseFloat(pressdryerAktif.rows[0]?.total_proses || 0),
          total_ok: parseFloat(pressdryerAktif.rows[0]?.total_ok || 0),
          total_reject: parseFloat(pressdryerAktif.rows[0]?.total_reject || 0)
        },
        lem_hari_ini: parseFloat(lemHariIni.rows[0]?.total_lem || 0),
        produksi_7_hari: produksi7Hari.rows,
        top_suppliers: topSuppliers.rows
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard/produksi-realtime - Real-time production stats
router.get('/produksi-realtime', authenticateToken, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM transaksi_bahan WHERE status = 'MENUNGGU QC') as qc_pending,
        (SELECT COUNT(DISTINCT mesin_id) FROM pressdryer_log 
         WHERE DATE(created_at) = CURRENT_DATE) as pressdryer_aktif,
        (SELECT SUM(jumlah) FROM transaksi_bahan tb 
         JOIN gudang g ON tb.lokasi_gudang_id = g.id 
         WHERE g.nama = 'Gudang B' AND tb.jumlah > 0) as gudang_b_stok,
        (SELECT SUM(jumlah) FROM transaksi_bahan tb 
         JOIN gudang g ON tb.lokasi_gudang_id = g.id 
         WHERE g.nama = 'Gudang C' AND tb.jumlah > 0) as gudang_c_stok,
        (SELECT SUM(jumlah) FROM finished_goods 
         WHERE status = 'TERSEDIA') as finished_goods_stok
    `);

    res.json({ success: true, data: stats.rows[0] });
  } catch (error) {
    console.error('Produksi realtime error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard/chart/produksi - Chart data produksi
router.get('/chart/produksi', authenticateToken, async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await db.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') as tanggal,
        tipe_plywood,
        SUM(jumlah) as total
      FROM finished_goods
      WHERE created_at >= CURRENT_DATE - INTERVAL '${parseInt(days)} days'
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), tipe_plywood
      ORDER BY tanggal ASC
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Chart produksi error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/dashboard/chart/pressdryer - Chart efficiency pressdryer
router.get('/chart/pressdryer', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        m.nomor as mesin,
        COUNT(*) as total_proses,
        SUM(pl.jumlah_masuk) as total_masuk,
        SUM(pl.hasil_ok) as total_ok,
        SUM(pl.hasil_reject) as total_reject,
        ROUND((SUM(pl.hasil_ok) / NULLIF(SUM(pl.jumlah_masuk), 0) * 100), 2) as efisiensi
      FROM pressdryer_log pl
      JOIN mesin_pressdryer m ON pl.mesin_id = m.id
      WHERE pl.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY m.nomor
      ORDER BY m.nomor
    `);

    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Chart pressdryer error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;