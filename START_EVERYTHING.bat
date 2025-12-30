@echo off
title Start Dashboard App - All Services
color 0B
cls
echo.
echo ========================================
echo   STARTING DASHBOARD APPLICATION
echo ========================================
echo.
echo This will start:
echo   1. PostgreSQL Database (Docker)
echo   2. Backend Server (Django)
echo   3. Frontend Server (React/Vite)
echo.
pause

cd /d %~dp0

echo.
echo ========================================
echo   Step 1: Starting PostgreSQL
echo ========================================
cd backend
docker-compose up -d postgres
if errorlevel 1 (
    echo.
    echo ERROR: Failed to start PostgreSQL!
    echo Make sure Docker Desktop is running.
    echo.
    pause
    exit /b 1
)
echo PostgreSQL started successfully!
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Step 2: Running Database Migrations
echo ========================================
call venv\Scripts\activate.bat
python manage.py migrate
if errorlevel 1 (
    echo.
    echo ERROR: Migrations failed!
    echo.
    pause
    exit /b 1
)
echo Migrations completed!

echo.
echo ========================================
echo   Step 3: Starting Backend Server
echo ========================================
start "Django Backend Server" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python manage.py runserver"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo   Step 4: Starting Frontend Server
echo ========================================
cd ..\frontend
start "React Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   ALL SERVICES STARTED!
echo ========================================
echo.
echo Backend:  http://localhost:8000/api/v1/
echo Frontend: http://localhost:5173
echo.
echo Three windows have opened:
echo   - Docker (PostgreSQL)
echo   - Django Backend Server
echo   - React Frontend Server
echo.
echo Keep all windows open!
echo.
echo Open your browser and go to:
echo   http://localhost:5173
echo.
echo ========================================
echo.
pause

