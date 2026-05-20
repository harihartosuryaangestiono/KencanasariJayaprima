const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/dashboard/summary - Dashboard Summary
router.get('/summary', authenticateToken, async (req, res) => {
  // Helper function untuk execute query dengan error handling
  const safeQuery = async (queryText, defaultValue) => {
    try {
      const result = await db.query(queryText);
      return result.rows;
    } catch (err) {
      console.error('Query error:', err.message);
      console.error('Query:', queryText);
      return defaultValue;
    }
  };

  try {
    // Total stok per gudang
    const stokGudang = await safeQuery(`
      SELECT 
        g.id,
        g.nama as gudang,
        COUNT(DISTINCT tb.id) as total_batch,
        COALESCE(SUM(tb.jumlah), 0) as total_jumlah
      FROM gudang g
      LEFT JOIN transaksi_bahan tb ON g.id = tb.lokasi_gudang_id 
        AND tb.jumlah > 0 
        AND tb.status != 'REJECT'
      GROUP BY g.id, g.nama
      ORDER BY g.id
    `, []);

    // Bahan menunggu QC
    const menungguQC = await safeQuery(`
      SELECT COUNT(*) as count
      FROM transaksi_bahan
      WHERE status = 'MENUNGGU QC'
    `, [{ count: '0' }]);

    // Produksi hari ini
    const produksiHariIni = await safeQuery(`
      SELECT 
        COUNT(*) as total_produksi,
        COALESCE(SUM(jumlah), 0) as total_jumlah
      FROM finished_goods
      WHERE created_at::date = CURRENT_DATE
    `, [{ total_produksi: '0', total_jumlah: '0' }]);

    // Pressdryer aktif hari ini
    const pressdryerAktif = await safeQuery(`
      SELECT 
        COUNT(DISTINCT mesin_id) as mesin_aktif,
        COALESCE(SUM(jumlah_masuk), 0) as total_proses,
        COALESCE(SUM(hasil_ok), 0) as total_ok,
        COALESCE(SUM(hasil_reject), 0) as total_reject
      FROM pressdryer_log
      WHERE created_at::date = CURRENT_DATE
    `, [{ mesin_aktif: '0', total_proses: '0', total_ok: '0', total_reject: '0' }]);

    // Penggunaan lem hari ini
    const lemHariIni = await safeQuery(`
      SELECT COALESCE(SUM(lem_qty), 0) as total_lem
      FROM setting_plywood
      WHERE created_at::date = CURRENT_DATE
    `, [{ total_lem: '0' }]);

    // Chart data - Produksi 7 hari terakhir
    const produksi7Hari = await safeQuery(`
      SELECT 
        created_at::date::text as tanggal,
        COALESCE(SUM(jumlah), 0) as total
      FROM finished_goods
      WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY created_at::date
      ORDER BY tanggal ASC
    `, []);

    // Top suppliers - hanya yang punya transaksi dalam 30 hari terakhir
    const topSuppliers = await safeQuery(`
      SELECT 
        s.id,
        s.nama,
        COUNT(tb.id) as total_transaksi,
        COALESCE(SUM(tb.jumlah), 0) as total_jumlah
      FROM suppliers s
      INNER JOIN transaksi_bahan tb ON s.id = tb.supplier_id 
        AND tb.created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY s.id, s.nama
      HAVING COUNT(tb.id) > 0
      ORDER BY total_transaksi DESC, total_jumlah DESC
      LIMIT 5
    `, []);

    res.json({
      success: true,
      data: {
        stok_gudang: stokGudang || [],
        menunggu_qc: parseInt(menungguQC[0]?.count || 0),
        produksi_hari_ini: {
          total: parseInt(produksiHariIni[0]?.total_produksi || 0),
          jumlah: parseFloat(produksiHariIni[0]?.total_jumlah || 0)
        },
        pressdryer_aktif: {
          mesin: parseInt(pressdryerAktif[0]?.mesin_aktif || 0),
          total_proses: parseFloat(pressdryerAktif[0]?.total_proses || 0),
          total_ok: parseFloat(pressdryerAktif[0]?.total_ok || 0),
          total_reject: parseFloat(pressdryerAktif[0]?.total_reject || 0)
        },
        lem_hari_ini: parseFloat(lemHariIni[0]?.total_lem || 0),
        produksi_7_hari: produksi7Hari || [],
        top_suppliers: topSuppliers || []
      }
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    
    // Return default data structure even on error
    res.status(500).json({ 
      success: false,
      error: 'Server error',
      message: error.message,
      data: {
        stok_gudang: [],
        menunggu_qc: 0,
        produksi_hari_ini: {
          total: 0,
          jumlah: 0
        },
        pressdryer_aktif: {
          mesin: 0,
          total_proses: 0,
          total_ok: 0,
          total_reject: 0
        },
        lem_hari_ini: 0,
        produksi_7_hari: [],
        top_suppliers: []
      }
    });
  }
});

// GET /api/dashboard/produksi-realtime - Real-time production stats
router.get('/produksi-realtime', authenticateToken, async (req, res) => {
  try {
    const stats = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM transaksi_bahan WHERE status = 'MENUNGGU QC') as qc_pending,
        (SELECT COUNT(DISTINCT mesin_id) FROM pressdryer_log 
         WHERE created_at::date = CURRENT_DATE) as pressdryer_aktif,
        (SELECT COALESCE(SUM(jumlah), 0) FROM transaksi_bahan tb 
         JOIN gudang g ON tb.lokasi_gudang_id = g.id 
         WHERE g.nama = 'Gudang B' AND tb.jumlah > 0) as gudang_b_stok,
        (SELECT COALESCE(SUM(jumlah), 0) FROM transaksi_bahan tb 
         JOIN gudang g ON tb.lokasi_gudang_id = g.id 
         WHERE g.nama = 'Gudang C' AND tb.jumlah > 0) as gudang_c_stok,
        (SELECT COALESCE(SUM(jumlah), 0) FROM finished_goods 
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