# School ERP - Frontend Startup (PowerShell)
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Blue
Write-Host "   School ERP - Frontend Startup" -ForegroundColor Blue
Write-Host "  ============================================" -ForegroundColor Blue
Write-Host ""

Set-Location F:\ERP_School\frontend

Write-Host "[1/2] Installing npm packages..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: npm install failed! Is Node.js installed?" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "      Done!" -ForegroundColor Green

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Blue
Write-Host "   App: http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "  ============================================" -ForegroundColor Blue
Write-Host ""

npm run dev
