@echo off
echo ============================================
echo Stock Information Tool (Standalone Edition)
echo ============================================
echo.

REM Check if Python is in PATH
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found.
    echo Please install Python from:
    echo https://www.python.org/downloads/
    echo.
    pause
    exit /b 1
)

echo Python detected.
echo.
echo Starting program...
echo.

REM Run Python script
python "%~dp0stock_standalone.py"

REM Pause on error
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] An error occurred during execution.
    pause
)
