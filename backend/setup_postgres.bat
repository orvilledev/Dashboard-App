@echo off
echo ========================================
echo AMZPulse PostgreSQL Setup
echo ========================================
echo.

echo Step 1: Checking Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo Docker is installed.
echo.

echo Step 2: Starting PostgreSQL container...
docker-compose up -d postgres

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Failed to start PostgreSQL container
    echo Please make sure Docker Desktop is running
    echo.
    pause
    exit /b 1
)

echo.
echo Waiting for PostgreSQL to be ready...
timeout /t 5 /nobreak >nul

echo.
echo Step 3: Running database migrations...
call venv\Scripts\activate.bat
python manage.py migrate

if %errorlevel% neq 0 (
    echo.
    echo ERROR: Migrations failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo PostgreSQL setup complete!
echo ========================================
echo.
echo Database: amzpulse_db
echo Host: localhost
echo Port: 5432
echo User: postgres
echo Password: postgres
echo.
echo You can now start the Django server:
echo   python manage.py runserver
echo.
pause

