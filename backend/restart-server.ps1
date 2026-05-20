# Script untuk restart server backend
Write-Host "🔄 Restarting Backend Server..." -ForegroundColor Cyan
Write-Host ""

# Stop existing Node processes on port 5000
Write-Host "Menghentikan proses Node.js yang menggunakan port 5000..."
$processes = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($processes) {
    foreach ($pid in $processes) {
        $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($proc -and $proc.ProcessName -eq "node") {
            Write-Host "  Menghentikan proses Node.js (PID: $pid)..."
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Seconds 2
}

# Start server
Write-Host ""
Write-Host "🚀 Menjalankan server backend..."
Write-Host ""
Set-Location $PSScriptRoot
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Server sedang dijalankan di jendela baru" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Tunggu 5 detik untuk server start..."
Start-Sleep -Seconds 5

# Test endpoint
Write-Host ""
Write-Host "🧪 Testing endpoint..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method Get -UseBasicParsing -TimeoutSec 3
    Write-Host "✅ Server berhasil di-restart!" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)"
    Write-Host ""
    Write-Host "📝 Endpoint export faceback seharusnya tersedia di:" -ForegroundColor Cyan
    Write-Host "   GET http://localhost:5000/api/laporan/export/faceback"
} catch {
    Write-Host "⚠️  Server mungkin masih starting..." -ForegroundColor Yellow
    Write-Host "   Silakan cek jendela PowerShell yang baru dibuka"
}

