@echo off
title School ERP - Backend
color 0A
echo.
echo  ============================================
echo   School ERP - Backend Startup
echo  ============================================
echo.

cd /d F:\ERP_School\backend

echo [1/4] Setting up virtual environment...
if not exist "venv\Scripts\activate.bat" (
    python -m venv venv
)

echo [2/4] Activating virtual environment...
call venv\Scripts\activate.bat

echo [3/4] Installing dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: pip install failed!
    pause
    exit /b 1
)
echo       Done!

echo [4/4] Setting up database and seeding...
python -m scripts.seed
echo       Done!

echo.
echo  ============================================
echo   API running at: http://localhost:8000
echo   API Docs      : http://localhost:8000/api/docs
echo   Press Ctrl+C to stop
echo  ============================================
echo.

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
