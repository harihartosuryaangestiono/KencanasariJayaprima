const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// GET /api/suppliers - Get all suppliers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT s.*, u.username as created_by_name 
       FROM suppliers s 
       LEFT JOIN users u ON s.created_by = u.id 
       ORDER BY s.created_at DESC`
    );
    res.json({ success: true, data: result.rows });
  } catch (error) {
    console.error('Get suppliers error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/suppliers/:id - Get supplier by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT s.*, u.username as created_by_name 
       FROM suppliers s 
       LEFT JOIN users u ON s.created_by = u.id 
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error('Get supplier error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/suppliers - Create supplier (PPIC only)
router.post('/', authenticateToken, authorizeRoles('PPIC'), [
  body('nama').trim().notEmpty().withMessage('Nama supplier wajib diisi'),
  body('alamat').optional(),
  body('kontak').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nama, alamat, kontak } = req.body;

    const result = await db.query(
      `INSERT INTO suppliers (nama, alamat, kontak, created_by) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [nama, alamat, kontak, req.user.id]
    );

    res.status(201).json({
      success: true,
      message: 'Supplier berhasil ditambahkan',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/suppliers/:id - Update supplier (PPIC only)
router.put('/:id', authenticateToken, authorizeRoles('PPIC'), [
  body('nama').trim().notEmpty().withMessage('Nama supplier wajib diisi'),
  body('alamat').optional(),
  body('kontak').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { nama, alamat, kontak } = req.body;

    const result = await db.query(
      `UPDATE suppliers 
       SET nama = $1, alamat = $2, kontak = $3 
       WHERE id = $4 
       RETURNING *`,
      [nama, alamat, kontak, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Supplier berhasil diupdate',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/suppliers/:id - Delete supplier (PPIC only)
router.delete('/:id', authenticateToken, authorizeRoles('PPIC'), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if supplier has transactions
    const checkResult = await db.query(
      'SELECT COUNT(*) as count FROM transaksi_bahan WHERE supplier_id = $1',
      [id]
    );

    if (checkResult.rows[0].count > 0) {
      return res.status(400).json({ 
        error: 'Supplier tidak dapat dihapus karena memiliki transaksi' 
      });
    }

    const result = await db.query(
      'DELETE FROM suppliers WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Supplier tidak ditemukan' });
    }

    res.json({
      success: true,
      message: 'Supplier berhasil dihapus'
    });
  } catch (error) {
    console.error('Delete supplier error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;