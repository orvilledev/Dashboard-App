@echo off
title Start Dashboard App - Backend and Frontend
color 0B
echo.
echo ========================================
echo   STARTING DASHBOARD APPLICATION
echo ========================================
echo.
echo This will start both:
echo   1. Backend Server (Django)
echo   2. Frontend Server (React/Vite)
echo.
echo Two windows will open - keep both open!
echo.
pause

echo.
echo Starting Backend Server...
start "Django Backend Server" cmd /k "cd /d %~dp0backend && venv\Scripts\activate && python manage.py runserver"

timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "React Frontend Server" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================
echo   SERVERS STARTING...
echo ========================================
echo.
echo Backend:  http://localhost:8000/api/v1/
echo Frontend: http://localhost:5173
echo.
echo Two windows have opened:
echo   - Django Backend Server
echo   - React Frontend Server
echo.
echo Keep both windows open!
echo.
echo Open your browser and go to:
echo   http://localhost:5173
echo.
echo ========================================
echo.
pause

