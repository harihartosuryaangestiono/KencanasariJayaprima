-- Database Schema untuk Plywood Monitoring System
-- DROP ALL TABLES (dengan urutan dependency)

DROP TABLE IF EXISTS laporan_penggunaan_lem CASCADE;
DROP TABLE IF EXISTS laporan_pressdryer CASCADE;
DROP TABLE IF EXISTS laporan_faceback CASCADE;
DROP TABLE IF EXISTS finished_goods CASCADE;
DROP TABLE IF EXISTS hotpress_log CASCADE;
DROP TABLE IF EXISTS setting_plywood CASCADE;
DROP TABLE IF EXISTS scraff_join_log CASCADE;
DROP TABLE IF EXISTS core_builder_log CASCADE;
DROP TABLE IF EXISTS repair_log CASCADE;
DROP TABLE IF EXISTS pressdryer_log CASCADE;
DROP TABLE IF EXISTS transaksi_bahan CASCADE;
DROP TABLE IF EXISTS mesin_pressdryer CASCADE;
DROP TABLE IF EXISTS gudang CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TABLE IF EXISTS users CASCADE;
SELECT *
FROM users;
-- Table Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('PPIC', 'PRODUKSI', 'BOS')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, password_hash, role) VALUES 
('trisni', '$2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG', 'PPIC'),
('produksi', '$2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG', 'PRODUKSI'),
('bos', '$2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG', 'BOS');

-- Table Suppliers
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    alamat TEXT,
    kontak VARCHAR(50),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Gudang
CREATE TABLE gudang (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    keterangan TEXT
);

-- Table Mesin Pressdryer
CREATE TABLE mesin_pressdryer (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(50) NOT NULL,
    nomor INTEGER UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'AKTIF'
);

-- Table Transaksi Bahan Baku
CREATE TABLE transaksi_bahan (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id),
    jenis VARCHAR(50) NOT NULL CHECK (jenis IN ('CORE', 'FACE', 'BACK', 'LONGCORE', 'LEM')),
    ketebalan DECIMAL(5,2),
    jumlah DECIMAL(10,2) NOT NULL,
    satuan VARCHAR(20) DEFAULT 'lembar',
    lokasi_gudang_id INTEGER REFERENCES gudang(id),
    status VARCHAR(50) DEFAULT 'MENUNGGU QC' CHECK (status IN ('MENUNGGU QC', 'OK', 'REJECT')),
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Pressdryer Log
CREATE TABLE pressdryer_log (
    id SERIAL PRIMARY KEY,
    mesin_id INTEGER REFERENCES mesin_pressdryer(id),
    pallet_id INTEGER REFERENCES transaksi_bahan(id),
    jumlah_masuk DECIMAL(10,2) NOT NULL,
    hasil_ok DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Repair Log
CREATE TABLE repair_log (
    id SERIAL PRIMARY KEY,
    bahan_id INTEGER REFERENCES transaksi_bahan(id),
    jumlah_masuk DECIMAL(10,2) NOT NULL,
    hasil_ok DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Core Builder Log
CREATE TABLE core_builder_log (
    id SERIAL PRIMARY KEY,
    bahan_id INTEGER REFERENCES transaksi_bahan(id),
    jumlah_masuk DECIMAL(10,2) NOT NULL,
    hasil_4x4 DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Scraff Join Log
CREATE TABLE scraff_join_log (
    id SERIAL PRIMARY KEY,
    bahan_id INTEGER REFERENCES transaksi_bahan(id),
    jumlah_masuk DECIMAL(10,2) NOT NULL,
    hasil_4x4 DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    arah_serat VARCHAR(50),
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Setting Plywood
CREATE TABLE setting_plywood (
    id SERIAL PRIMARY KEY,
    tipe_plywood VARCHAR(20) NOT NULL CHECK (tipe_plywood IN ('3MM', '9MM', '29MM')),
    shortcore_qty DECIMAL(10,2) DEFAULT 0,
    longcore_qty DECIMAL(10,2) DEFAULT 0,
    face_qty DECIMAL(10,2) DEFAULT 0,
    back_qty DECIMAL(10,2) DEFAULT 0,
    lem_qty DECIMAL(10,2) DEFAULT 0,
    hasil_ok DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Hotpress Log
CREATE TABLE hotpress_log (
    id SERIAL PRIMARY KEY,
    setting_plywood_id INTEGER REFERENCES setting_plywood(id),
    jumlah_masuk DECIMAL(10,2) NOT NULL,
    hasil_ok DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Finished Goods
CREATE TABLE finished_goods (
    id SERIAL PRIMARY KEY,
    tipe_plywood VARCHAR(20) NOT NULL,
    jumlah DECIMAL(10,2) NOT NULL,
    grading VARCHAR(20),
    hotpress_log_id INTEGER REFERENCES hotpress_log(id),
    lokasi_gudang_id INTEGER REFERENCES gudang(id),
    status VARCHAR(20) DEFAULT 'TERSEDIA',
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Laporan Faceback
CREATE TABLE laporan_faceback (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    face_jumlah DECIMAL(10,2) DEFAULT 0,
    back_jumlah DECIMAL(10,2) DEFAULT 0,
    set_jumlah DECIMAL(10,2) DEFAULT 0,
    reject_jumlah DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Laporan Pressdryer
CREATE TABLE laporan_pressdryer (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    mesin_id INTEGER REFERENCES mesin_pressdryer(id),
    pallet_masuk INTEGER DEFAULT 0,
    hasil_ok DECIMAL(10,2) DEFAULT 0,
    hasil_reject DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table Laporan Penggunaan Lem
CREATE TABLE laporan_penggunaan_lem (
    id SERIAL PRIMARY KEY,
    tanggal DATE NOT NULL,
    tipe_plywood VARCHAR(20),
    lem_qty DECIMAL(10,2) DEFAULT 0,
    produksi_qty DECIMAL(10,2) DEFAULT 0,
    keterangan TEXT,
    user_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Initial Data

-- Insert Gudang
INSERT INTO gudang (nama, keterangan) VALUES 
('Gudang A', 'Gudang Bahan Baku Mentah'),
('Gudang B', 'Gudang Hasil Pressdryer'),
('Gudang C', 'Gudang Hasil Repair/Core Builder/Scraff Join'),
('Gudang Finished', 'Gudang Barang Jadi');

-- Insert Mesin Pressdryer
INSERT INTO mesin_pressdryer (nama, nomor, status) VALUES 
('Pressdryer 1', 1, 'AKTIF'),
('Pressdryer 2', 2, 'AKTIF'),
('Pressdryer 3', 3, 'AKTIF'),
('Pressdryer 4', 4, 'AKTIF'),
('Pressdryer 5', 5, 'AKTIF'),
('Pressdryer 6', 6, 'AKTIF');

-- Insert Default Users (password: password123 - hashed dengan bcrypt)
-- Hash: $2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG
INSERT INTO users (username, password_hash, role) VALUES 
('trisni', '$2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG', 'PPIC'),
('produksi', '$2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG', 'PRODUKSI'),
('bos', '$2b$10$8K1p/eJ0Y9Z8nE3kQmHvW.bOWJXr3vZQxGx7LXlTLZJ3Z9Nf0cZfG', 'BOS');

-- Insert Dummy Suppliers
INSERT INTO suppliers (nama, alamat, kontak, created_by) VALUES 
('PT Kayu Jaya', 'Jl. Industri No. 123, Jakarta', '021-12345678', 1),
('CV Plywood Makmur', 'Jl. Raya Cikupa, Tangerang', '021-87654321', 1),
('UD Sumber Rezeki', 'Jl. Pasar Baru No. 45, Bekasi', '021-11223344', 1);

-- Insert Dummy Transaksi Bahan
INSERT INTO transaksi_bahan (supplier_id, jenis, ketebalan, jumlah, satuan, lokasi_gudang_id, status, user_id) VALUES 
(1, 'CORE', 1.5, 500, 'lembar', 1, 'MENUNGGU QC', 1),
(1, 'FACE', 0.3, 300, 'lembar', 1, 'OK', 1),
(2, 'BACK', 0.3, 300, 'lembar', 1, 'OK', 1),
(2, 'LONGCORE', 2.9, 200, 'lembar', 1, 'MENUNGGU QC', 1),
(3, 'LEM', NULL, 100, 'kg', 1, 'OK', 1);

-- Create Indexes for Better Performance
CREATE INDEX idx_transaksi_bahan_supplier ON transaksi_bahan(supplier_id);
CREATE INDEX idx_transaksi_bahan_status ON transaksi_bahan(status);
CREATE INDEX idx_transaksi_bahan_lokasi ON transaksi_bahan(lokasi_gudang_id);
CREATE INDEX idx_pressdryer_log_mesin ON pressdryer_log(mesin_id);
CREATE INDEX idx_setting_plywood_created ON setting_plywood(created_at);
CREATE INDEX idx_finished_goods_status ON finished_goods(status);