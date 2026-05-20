# 🚀 Panduan Menjalankan Backend Server

## ⚠️ Error: "Tidak dapat terhubung ke server"

Jika Anda melihat error ini, ikuti langkah-langkah berikut:

## 📋 Prerequisites

1. **PostgreSQL harus berjalan**
   - Pastikan PostgreSQL service aktif
   - Windows: Buka Services → cari "PostgreSQL" → pastikan status "Running"
   - Atau jalankan: `pg_ctl start` (jika di PATH)

2. **Database harus sudah dibuat**
   - Database name default: `plywood_production`
   - Jika belum ada, buat dengan:
     ```sql
     CREATE DATABASE plywood_production;
     ```

## 🔧 Setup Environment Variables

1. **Buat file `.env` di folder `backend/`**
   ```bash
   cd backend
   copy .env.example .env
   # atau di Linux: cp .env.example .env
   ```

2. **Edit file `.env`** sesuai konfigurasi database Anda:
   ```env
   PORT=5000
   NODE_ENV=development
   
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_NAME=plywood_production
   
   JWT_SECRET=plywood-secret-key-2024-very-secure-min-32-chars
   CORS_ORIGIN=*
   ```

   ⚠️ **PENTING**: Ganti `your_postgres_password` dengan password PostgreSQL Anda!

## 🚀 Menjalankan Server

### Opsi 1: Development Mode (dengan auto-reload)
```bash
cd backend
npm run dev
```

### Opsi 2: Production Mode
```bash
cd backend
npm start
```

## ✅ Verifikasi Server Berjalan

Setelah server berjalan, Anda akan melihat:
```
🚀 Server running on http://0.0.0.0:5000
📊 Environment: development
✅ Connected to PostgreSQL database
```

Test dengan membuka browser atau curl:
```
http://localhost:5000/api/health
```

Seharusnya mengembalikan:
```json
{"status":"OK","timestamp":"2024-..."}
```

## 🔍 Troubleshooting

### 1. Error: "Cannot connect to database"
- **Cek PostgreSQL berjalan**: 
  - Windows: Services → PostgreSQL
  - Linux: `sudo systemctl status postgresql`
- **Cek kredensial database** di file `.env`
- **Test koneksi manual**:
  ```bash
  psql -U postgres -d plywood_production -c "SELECT 1;"
  ```

### 2. Error: "Port 5000 already in use"
- Cari proses yang menggunakan port 5000:
  ```bash
  # Windows
  netstat -ano | findstr :5000
  
  # Linux
  lsof -i :5000
  ```
- Kill proses tersebut atau ubah PORT di `.env`

### 3. Error: "Module not found"
- Install dependencies:
  ```bash
  cd backend
  npm install
  ```

### 4. Database belum ada
- Buat database:
  ```sql
  psql -U postgres
  CREATE DATABASE plywood_production;
  \q
  ```
- Import schema (jika ada):
  ```bash
  psql -U postgres -d plywood_production -f ../database/schema.sql
  ```

## 📝 Catatan

- Server akan berjalan di `http://localhost:5000`
- Frontend akan menggunakan proxy ke `http://localhost:5000/api` (lihat `frontend/vite.config.js`)
- Pastikan backend berjalan SEBELUM menjalankan frontend

