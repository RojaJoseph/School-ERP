@echo off
title School ERP - Frontend
color 0B
echo.
echo  ============================================
echo   School ERP - Frontend Startup
echo  ============================================
echo.

cd /d F:\ERP_School\frontend

echo Installing npm packages (skip if already done)...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed! Is Node.js installed?
    pause
    exit /b 1
)

echo.
echo  ============================================
echo   Frontend: http://localhost:3000
echo   Press Ctrl+C to stop
echo  ============================================
echo.

npm run dev
