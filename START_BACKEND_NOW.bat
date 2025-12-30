@echo off
title Django Backend Server - KEEP THIS WINDOW OPEN
color 0A
cls
echo.
echo ========================================
echo   DJANGO BACKEND SERVER
echo ========================================
echo.
cd /d %~dp0backend
echo Current directory: %CD%
echo.
echo Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo.
    echo ERROR: Failed to activate virtual environment!
    echo.
    pause
    exit /b 1
)
echo.
echo ========================================
echo   Starting server...
echo ========================================
echo.
echo Server will be available at:
echo   http://localhost:8000/api/v1/
echo.
echo KEEP THIS WINDOW OPEN!
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.
python manage.py runserver
echo.
echo ========================================
echo   Server stopped
echo ========================================
pause

