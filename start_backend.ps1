# School ERP - Backend Startup (PowerShell)
Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   School ERP - Backend Startup" -ForegroundColor Green
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""

Set-Location F:\ERP_School\backend

# Create venv if missing
if (-not (Test-Path "venv\Scripts\Activate.ps1")) {
    Write-Host "[1/4] Creating virtual environment..." -ForegroundColor Cyan
    python -m venv venv
    Write-Host "      Done!" -ForegroundColor Green
} else {
    Write-Host "[1/4] Virtual environment exists." -ForegroundColor Gray
}

# Activate
Write-Host "[2/4] Activating virtual environment..." -ForegroundColor Cyan
& "venv\Scripts\Activate.ps1"

# Install deps
Write-Host "[3/4] Installing dependencies..." -ForegroundColor Cyan
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pip install failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "      Done!" -ForegroundColor Green

# Seed
Write-Host "[4/4] Seeding database..." -ForegroundColor Cyan
python -m scripts.seed
Write-Host "      Done!" -ForegroundColor Green

Write-Host ""
Write-Host "  ============================================" -ForegroundColor Green
Write-Host "   API: http://localhost:8000" -ForegroundColor Yellow
Write-Host "   Docs: http://localhost:8000/api/docs" -ForegroundColor Yellow
Write-Host "   Press Ctrl+C to stop" -ForegroundColor Gray
Write-Host "  ============================================" -ForegroundColor Green
Write-Host ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
