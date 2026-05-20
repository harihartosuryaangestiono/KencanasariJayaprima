// Script untuk memeriksa setup backend
require('dotenv').config();
const { Pool } = require('pg');

console.log('🔍 Memeriksa konfigurasi backend...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('  PORT:', process.env.PORT || '5000 (default)');
console.log('  DB_HOST:', process.env.DB_HOST || 'localhost (default)');
console.log('  DB_PORT:', process.env.DB_PORT || '5432 (default)');
console.log('  DB_USER:', process.env.DB_USER || 'postgres (default)');
console.log('  DB_NAME:', process.env.DB_NAME || 'plywood_production (default)');
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'TIDAK ADA!');
console.log('  JWT_SECRET:', process.env.JWT_SECRET ? '***' : 'TIDAK ADA!');
console.log('');

// Test database connection
if (!process.env.DB_PASSWORD) {
  console.log('❌ ERROR: DB_PASSWORD tidak ditemukan di file .env!');
  console.log('   Silakan edit file backend/.env dan tambahkan DB_PASSWORD');
  process.exit(1);
}

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'plywood_production',
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
  connectionTimeoutMillis: 5000,
});

console.log('🔌 Mencoba koneksi ke database...');

pool.query('SELECT NOW() as current_time, version() as pg_version')
  .then(result => {
    console.log('✅ Koneksi database BERHASIL!');
    console.log('   PostgreSQL Version:', result.rows[0].pg_version.split(',')[0]);
    console.log('   Current Time:', result.rows[0].current_time);
    console.log('');
    console.log('✅ Semua setup OK! Server siap dijalankan.');
    console.log('   Jalankan: npm start atau npm run dev');
    pool.end();
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ ERROR: Tidak dapat terhubung ke database!');
    console.log('   Error:', err.message);
    console.log('');
    console.log('🔧 Kemungkinan penyebab:');
    console.log('   1. PostgreSQL service tidak berjalan');
    console.log('   2. Kredensial database salah (cek file .env)');
    console.log('   3. Database belum dibuat');
    console.log('   4. Port PostgreSQL salah');
    console.log('');
    console.log('💡 Solusi:');
    console.log('   - Windows: Buka Services → cari "PostgreSQL" → Start');
    console.log('   - Cek file backend/.env, pastikan DB_PASSWORD benar');
    console.log('   - Buat database: CREATE DATABASE plywood_production;');
    pool.end();
    process.exit(1);
  });

