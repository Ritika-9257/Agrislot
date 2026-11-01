@echo off
title AgriSlot Launcher
echo ========================================================
echo        Starting AgriSlot Full-Stack Platform
echo ========================================================
echo.
echo [1/2] Launching AgriSlot Express Backend on Port 5001...
start "AgriSlot Backend (Port 5001)" cmd /k "cd /d %~dp0backend && npm.cmd start"

echo [2/2] Launching AgriSlot Next.js Frontend on Port 3000...
start "AgriSlot Frontend (Port 3000)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev"

echo.
echo ========================================================
echo  AgriSlot is running!
echo  - Frontend Web UI:  http://localhost:3000
echo  - Backend API:      http://localhost:5001/api/v1/health
echo ========================================================
echo.
pause
