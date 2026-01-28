@echo off
chcp 65001 >nul
echo ========================================
echo   Stock Analysis Platform - Dev Server
echo ========================================
echo.
echo Starting Backend and Frontend servers...
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.

REM Backend 서버 시작 (새 창)
start "Backend Server (Port 8000)" cmd /k "cd /d %~dp0backend && echo Starting Backend... && python -m app.main"

REM 잠시 대기 (Backend가 먼저 시작되도록)
timeout /t 3 /nobreak >nul

REM Frontend 서버 시작 (새 창)
start "Frontend Dev Server (Port 5173)" cmd /k "cd /d %~dp0frontend && echo Starting Frontend... && npm run dev"

echo.
echo ========================================
echo   Both servers are starting!
echo ========================================
echo.
echo - Backend will open in a new window
echo - Frontend will open in another window
echo - Close those windows to stop the servers
echo.
echo Press any key to close this launcher...
pause >nul
