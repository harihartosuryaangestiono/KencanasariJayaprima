require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import Routes
const authRoutes = require('./src/routes/auth');
const supplierRoutes = require('./src/routes/suppliers');
const bahanRoutes = require('./src/routes/bahan');
const qcRoutes = require('./src/routes/qc');
const pressdryerRoutes = require('./src/routes/pressdryer');
const produksiRoutes = require('./src/routes/produksi');
const laporanRoutes = require('./src/routes/laporan');
const dashboardRoutes = require('./src/routes/dashboard');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/bahan', bahanRoutes);
app.use('/api/qc', qcRoutes);
app.use('/api/pressdryer', pressdryerRoutes);
app.use('/api/produksi', produksiRoutes);
app.use('/api/laporan', laporanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// DB Test (temporary debug)
app.get('/api/db-test', async (req, res) => {
  const db = require('./src/config/database');
  try {
    const result = await db.query('SELECT COUNT(*) FROM users');
    res.json({ success: true, userCount: result.rows[0].count });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, code: err.code });
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;