@echo off
title Django Backend Server
color 0A
echo.
echo ========================================
echo   STARTING DJANGO BACKEND SERVER
echo ========================================
echo.
cd /d %~dp0
echo Current directory: %CD%
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment!
    echo.
    pause
    exit /b 1
)
echo.
echo Starting Django server...
echo.
echo ========================================
echo   Server will be available at:
echo   http://localhost:8000/api/v1/
echo ========================================
echo.
echo KEEP THIS WINDOW OPEN!
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.
python manage.py runserver
if errorlevel 1 (
    echo.
    echo ========================================
    echo   ERROR: Server failed to start!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Make sure virtual environment is activated
    echo 2. Install dependencies: pip install -r requirements.txt
    echo 3. Run migrations: python manage.py migrate
    echo.
    pause
)
