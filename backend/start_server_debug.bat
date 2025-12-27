@echo off
echo ========================================
echo Starting Django Backend Server (Debug Mode)
echo ========================================
cd /d %~dp0

echo.
echo [1/4] Activating virtual environment...
call venv\Scripts\activate
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment!
    pause
    exit /b 1
)

echo [2/4] Checking Django configuration...
python manage.py check
if errorlevel 1 (
    echo ERROR: Django configuration check failed!
    pause
    exit /b 1
)

echo [3/4] Checking database...
python manage.py showmigrations --list | findstr "\[ \]" >nul
if errorlevel 1 (
    echo WARNING: Some migrations may not be applied.
    echo Run: python manage.py migrate
)

echo [4/4] Starting development server...
echo.
echo ========================================
echo Server will start at: http://127.0.0.1:8000/
echo API endpoint: http://localhost:8000/api/v1/
echo ========================================
echo.
echo Press Ctrl+C to stop the server
echo.

python manage.py runserver
pause

