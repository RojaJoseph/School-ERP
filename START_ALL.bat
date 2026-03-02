@echo off
title School ERP - Full Stack Launch
color 0A

echo.
echo  =============================================
echo    School ERP - Starting All Services
echo  =============================================
echo.
echo  Backend  will run on: http://localhost:8000
echo  Frontend will run on: http://localhost:3000
echo  API Docs            : http://localhost:8000/api/docs
echo.
echo  Opening two terminal windows...
echo.

:: Start backend in new window
start "Backend - FastAPI" cmd /k "cd /d F:\ERP_School && start_backend.bat"

:: Wait 3 seconds then start frontend
timeout /t 3 /nobreak > nul

:: Start frontend in new window
start "Frontend - Next.js" cmd /k "cd /d F:\ERP_School && start_frontend.bat"

echo  Both services are starting in separate windows.
echo  Wait ~15 seconds then open: http://localhost:3000
echo.
pause
