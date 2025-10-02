# Plywood Monitoring System

Sistem monitoring produksi plywood berbasis web dengan role-based access untuk PPIC, Produksi, dan Bos.

## 🚀 Fitur Utama

### PPIC (Komputer 1 - Kantor Depan)
- ✅ Kelola data supplier
- ✅ Input bahan baku masuk (core, face, back, longcore, lem)
- ✅ Data otomatis masuk ke Gudang A dengan status "MENUNGGU QC"

### Wakil Kepala Produksi (Komputer 2 - Produksi/Gudang)
- ✅ QC Checklist bahan di Gudang A (OK/REJECT)
- ✅ Proses CORE ke Pressdryer (6 mesin)
- ✅ Proses Repair, Core Builder, Scraff Join
- ✅ Setting Plywood & Hotpress
- ✅ Real-time monitoring stok gudang

### Bos (Komputer 3 - Monitoring)
- ✅ Dashboard real-time
- ✅ Laporan Face & Back
- ✅ Laporan Pressdryer
- ✅ Laporan Penggunaan Lem
- ✅ Laporan Stok Gudang
- ✅ Export Excel/PDF

## 📋 Prerequisites

- Node.js v18+ dan npm
- PostgreSQL v14+
- Git

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd plywood-monitoring
```

### 2. Setup Database

```bash
# Login ke PostgreSQL
psql -U postgres

# Buat database
CREATE DATABASE plywood_monitoring;

# Keluar dari psql
\q

# Import schema
psql -U postgres -d plywood_monitoring -f database/schema.sql
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy file .env
cp .env.example .env

# Edit .env sesuai konfigurasi database Anda
nano .env
```

Isi file `.env`:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=plywood_monitoring

JWT_SECRET=your-secret-key-min-32-chars
CORS_ORIGIN=http://localhost:5173
```

```bash
# Jalankan server
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### 4. Setup Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Buat file .env (opsional)
echo "VITE_API_URL=http://localhost:5000/api" > .env

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## 🖥️ Deployment untuk LAN (3 Komputer)

### Setup Server (1 komputer jadi server)

1. **Install PostgreSQL & Node.js** di komputer server
2. **Setup Database** seperti langkah di atas
3. **Cari IP Address** komputer server:

```bash
# Windows
ipconfig

# Linux/Mac
ifconfig
# atau
ip addr show
```

Misal IP server: `192.168.1.100`

4. **Update Backend .env**:

```env
PORT=5000
NODE_ENV=production
DB_HOST=localhost
# ... konfigurasi lainnya
```

5. **Build Frontend**:

```bash
cd frontend
npm run build
```

6. **Serve Frontend dari Backend** (edit `backend/server.js`):

```javascript
const path = require('path');

// Setelah semua routes, tambahkan:
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

7. **Jalankan Server**:

```bash
cd backend
npm start
```

### Akses dari Komputer Lain

Dari komputer 1, 2, dan 3, buka browser dan akses:

```
http://192.168.1.100:5000
```

## 👥 Default Users

| Username  | Password     | Role      | Komputer |
|-----------|--------------|-----------|----------|
| trisni    | password123  | PPIC      | 1        |
| produksi  | password123  | PRODUKSI  | 2        |
| bos       | password123  | BOS       | 3        |

⚠️ **PENTING**: Ganti password default setelah instalasi!

## 📁 Struktur Project

```
plywood-monitoring/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config
│   │   ├── middleware/     # Auth & validation
│   │   ├── routes/         # API routes
│   │   └── ...
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Pages per role
│   │   ├── utils/          # API & helpers
│   │   └── App.jsx
│   └── package.json
└── database/
    └── schema.sql          # Database schema
```

## 🔄 Alur Produksi

1. **PPIC** input bahan dari supplier → Gudang A (MENUNGGU QC)
2. **Produksi** QC bahan → OK (tetap Gudang A) / REJECT
3. **Produksi** proses CORE → Pressdryer (6 mesin) → Gudang B
4. **Produksi** Gudang B → Repair/Core Builder/Scraff Join → Gudang C
5. **Produksi** Setting Plywood (kombinasi bahan + lem) → Hotpress
6. **Produksi** Hotpress → Cutting → Grading → Gudang Finished
7. **Bos** monitoring & laporan real-time

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/register` - Register (admin only)

### Suppliers (PPIC)
- `GET /api/suppliers` - Get all suppliers
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Delete supplier

### Bahan Baku (PPIC)
- `GET /api/bahan` - Get all bahan
- `POST /api/bahan` - Input bahan masuk
- `GET /api/bahan/stok/summary` - Stok summary

### QC (Produksi)
- `GET /api/qc/pending` - Bahan menunggu QC
- `PUT /api/qc/:id/approve` - Approve QC
- `PUT /api/qc/:id/reject` - Reject QC

### Pressdryer (Produksi)
- `GET /api/pressdryer/mesin` - Get all mesin
- `GET /api/pressdryer/core-available` - Core ready to process
- `POST /api/pressdryer/process` - Process to pressdryer
- `GET /api/pressdryer/logs` - Get logs

### Produksi
- `POST /api/produksi/repair` - Process repair
- `POST /api/produksi/core-builder` - Core builder 4x4
- `POST /api/produksi/scraff-join` - Scraff join 4x4
- `POST /api/produksi/setting-plywood` - Setting plywood
- `POST /api/produksi/hotpress` - Hotpress process

### Laporan
- `GET /api/laporan/faceback` - Laporan face & back
- `GET /api/laporan/pressdryer` - Laporan pressdryer
- `GET /api/laporan/penggunaan-lem` - Laporan lem
- `GET /api/laporan/stok-gudang` - Laporan stok
- `GET /api/laporan/export/pressdryer` - Export Excel

### Dashboard
- `GET /api/dashboard/summary` - Dashboard summary
- `GET /api/dashboard/produksi-realtime` - Real-time stats

## 🐛 Troubleshooting

### Database Connection Error
```bash
# Cek PostgreSQL running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Port Already in Use
```bash
# Ganti PORT di .env file
PORT=5001
```

### CORS Error
```bash
# Update CORS_ORIGIN di backend .env
CORS_ORIGIN=http://192.168.1.100:5173
```

### Cannot Access from Other Computer
- Pastikan firewall mengizinkan port 5000
- Cek IP address benar
- Pastikan semua komputer dalam satu network

## 📝 TODO / Future Enhancements

- [ ] Upload foto hasil QC
- [ ] Notifikasi real-time (WebSocket)
- [ ] Export PDF laporan
- [ ] Barcode scanner integration
- [ ] Mobile app
- [ ] Advanced analytics & forecasting

## 📞 Support

Untuk bantuan, hubungi tim IT atau buat issue di repository.

## 📄 License

Proprietary - Internal Company Use Only