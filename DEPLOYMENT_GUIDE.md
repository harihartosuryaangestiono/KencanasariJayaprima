# 🚀 Panduan Deployment untuk 3 Komputer di LAN

## 📋 Persiapan

### Hardware Requirements
- **Server (1 Komputer)**: RAM 4GB+, Storage 20GB+
- **Client (2 Komputer)**: RAM 2GB+, Browser modern (Chrome/Firefox)
- **Network**: Semua komputer terhubung dalam 1 LAN/WiFi yang sama

### Software Requirements (Server)
- Windows 10/11 atau Linux (Ubuntu 20.04+)
- PostgreSQL 14+
- Node.js 18+
- Git (opsional)

---

## 🔧 Setup Server (Komputer Server)

### 1. Install PostgreSQL

**Windows:**
- Download dari https://www.postgresql.org/download/windows/
- Install dengan password yang mudah diingat (misal: `postgres123`)
- Port default: 5432

**Linux (Ubuntu):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Set password untuk user postgres
sudo -u postgres psql
ALTER USER postgres PASSWORD 'postgres123';
\q
```

### 2. Install Node.js

**Windows:**
- Download dari https://nodejs.org/ (LTS version)
- Install dengan setting default

**Linux:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verifikasi:
```bash
node --version
npm --version
```

### 3. Setup Project

```bash
# Clone atau copy project ke server
cd /path/to/project
cd plywood-monitoring

# Setup Database
psql -U postgres
CREATE DATABASE plywood_monitoring;
\q

psql -U postgres -d plywood_monitoring -f database/schema.sql
```

### 4. Konfigurasi Backend

```bash
cd backend
npm install

# Buat file .env
cp .env.example .env

# Edit file .env (gunakan notepad atau nano)
notepad .env  # Windows
nano .env     # Linux
```

Isi `.env`:
```env
PORT=5000
NODE_ENV=production

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=plywood_monitoring

JWT_SECRET=plywood-secret-key-2024-very-secure-min-32-chars

CORS_ORIGIN=*
```

### 5. Build Frontend

```bash
cd ../frontend
npm install

# Buat file .env untuk production
echo "VITE_API_URL=http://192.168.1.100:5000/api" > .env

# GANTI 192.168.1.100 dengan IP server Anda!

# Build
npm run build
```

### 6. Setup Static Serving

Edit file `backend/server.js`, tambahkan di bagian atas:
```javascript
const path = require('path');
```

Tambahkan sebelum error handler (setelah semua routes):
```javascript
// Serve static files from React app
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Handle React routing, return all requests to React app
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});
```

### 7. Cari IP Address Server

**Windows:**
```cmd
ipconfig
```
Cari "IPv4 Address" pada adapter yang aktif (misal: `192.168.1.100`)

**Linux:**
```bash
ip addr show
# atau
hostname -I
```

### 8. Buka Port di Firewall

**Windows:**
1. Control Panel → Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port → TCP → 5000 → Allow
4. Apply

**Linux (Ubuntu):**
```bash
sudo ufw allow 5000/tcp
sudo ufw reload
```

### 9. Jalankan Server

```bash
cd backend

# Untuk testing
npm run dev

# Untuk production (tetap running)
npm start

# Atau gunakan PM2 untuk auto-restart
npm install -g pm2
pm2 start server.js --name plywood-api
pm2 save
pm2 startup
```

### 10. Test dari Server

Buka browser di komputer server, akses:
```
http://localhost:5000
```

Seharusnya muncul halaman login.

---

## 💻 Setup Client (Komputer 1, 2, 3)

### Komputer 1 (PPIC - Trisni)
1. Buka browser (Chrome/Firefox)
2. Akses: `http://192.168.1.100:5000` (ganti dengan IP server)
3. Login dengan:
   - Username: `trisni`
   - Password: `password123`
4. Bookmark URL untuk akses cepat

### Komputer 2 (Produksi - Wakil Kepala Produksi)
1. Buka browser
2. Akses: `http://192.168.1.100:5000`
3. Login dengan:
   - Username: `produksi`
   - Password: `password123`
4. Bookmark URL

### Komputer 3 (Bos - Monitoring)
1. Buka browser
2. Akses: `http://192.168.1.100:5000`
3. Login dengan:
   - Username: `bos`
   - Password: `password123`
4. Bookmark URL

---

## 🔒 Keamanan

### 1. Ganti Password Default

Login sebagai Bos, akses endpoint (gunakan Postman atau curl):
```bash
POST http://192.168.1.100:5000/api/auth/register
Headers: Authorization: Bearer <token-bos>
Body: {
  "username": "new_user",
  "password": "new_secure_password",
  "role": "PPIC"
}
```

### 2. Ganti JWT Secret

Edit `backend/.env`:
```env
JWT_SECRET=plywood-production-secret-2024-min-32-chars-random
```

Restart server.

### 3. Database Backup

```bash
# Backup
pg_dump -U postgres plywood_monitoring > backup_$(date +%Y%m%d).sql

# Restore
psql -U postgres plywood_monitoring < backup_20240101.sql
```

---

## 🔍 Troubleshooting

### Tidak Bisa Akses dari Client

**Check 1: Ping Server**
```bash
ping 192.168.1.100
```
Jika tidak bisa ping, periksa koneksi network.

**Check 2: Test Port**
```bash
telnet 192.168.1.100 5000
# atau
curl http://192.168.1.100:5000/api/health
```

**Check 3: Firewall**
- Pastikan firewall mengizinkan port 5000
- Coba disable firewall sementara untuk testing

**Check 4: Server Berjalan**
```bash
# Windows
netstat -ano | findstr :5000

# Linux
netstat -tulpn | grep :5000
```

### Database Connection Error

```bash
# Cek PostgreSQL running
# Windows: Services → PostgreSQL
# Linux:
sudo systemctl status postgresql

# Test connection
psql -U postgres -d plywood_monitoring -c "SELECT 1;"
```

### CORS Error

Edit `backend/server.js`:
```javascript
app.use(cors({
  origin: '*',  // Allow all origins (untuk LAN)
  credentials: true
}));
```

---

## 📱 Akses dari HP/Tablet (Bonus)

Jika ingin akses dari HP yang terhubung WiFi yang sama:

1. Pastikan HP terhubung WiFi yang sama dengan server
2. Buka browser di HP
3. Akses: `http://192.168.1.100:5000`
4. Login sesuai role

---

## 🔄 Update Aplikasi

Jika ada update code:

```bash
# Di server
cd plywood-monitoring

# Pull update (jika pakai git)
git pull

# Update backend
cd backend
npm install

# Rebuild frontend
cd ../frontend
npm install
npm run build

# Restart server
cd ../backend
pm2 restart plywood-api
# atau
# Ctrl+C dan npm start lagi
```

---

## 💾 Auto Start on Boot

**Windows:**
1. Buat file `start_server.bat`:
```batch
@echo off
cd C:\path\to\plywood-monitoring\backend
npm start
```
2. Copy ke Startup folder: `shell:startup`

**Linux (systemd):**
```bash
sudo nano /etc/systemd/system/plywood.service
```

Isi:
```ini
[Unit]
Description=Plywood Monitoring API
After=network.target postgresql.service

[Service]
Type=simple
User=your_username
WorkingDirectory=/path/to/plywood-monitoring/backend
ExecStart=/usr/bin/node server.js
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable:
```bash
sudo systemctl enable plywood.service
sudo systemctl start plywood.service
```

---

## 📞 Support

Jika ada masalah:
1. Check log di `backend/` console
2. Check browser console (F12)
3. Periksa koneksi network
4. Restart server dan PostgreSQL

**Emergency Contact:** IT Department