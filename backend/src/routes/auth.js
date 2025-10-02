const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { JWT_SECRET, authenticateToken, authorizeRoles } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').notEmpty().withMessage('Password required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;

    // Cari user
    const result = await db.query(
      'SELECT id, username, password_hash, role FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const user = result.rows[0];

    // Verifikasi password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Generate token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, username, role, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/register - Admin only
router.post('/register', authenticateToken, authorizeRoles('BOS'), [
  body('username').trim().notEmpty().withMessage('Username required'),
  body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  body('role').isIn(['PPIC', 'PRODUKSI', 'BOS']).withMessage('Role tidak valid')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, password, role } = req.body;

    // Cek username sudah ada
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await db.query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
      [username, passwordHash, role]
    );

    res.status(201).json({
      success: true,
      message: 'User berhasil dibuat',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;