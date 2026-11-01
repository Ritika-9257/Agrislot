@echo off
title AgriSlot QA & System Verification
echo ========================================================
echo        Running AgriSlot Verification & Test Suites
echo ========================================================
echo.
cd /d %~dp0
echo [1/3] Running System Diagnostic Check...
node scripts/verify_system.js
echo.
echo [2/3] Running 38-Step Live E2E Integration Suite...
node scripts/e2e_verification.js
echo.
echo [3/3] Running 75-Unit & Integration Test Suite...
cd backend
call npm.cmd test
echo.
echo ========================================================
echo  All Tests Completed!
echo ========================================================
pause
