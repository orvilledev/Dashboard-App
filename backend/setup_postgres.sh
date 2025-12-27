#!/bin/bash

echo "========================================"
echo "AMZPulse PostgreSQL Setup"
echo "========================================"
echo ""

echo "Step 1: Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

echo "Docker is installed."
echo ""

echo "Step 2: Starting PostgreSQL container..."
docker-compose up -d postgres

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Failed to start PostgreSQL container"
    echo "Please make sure Docker Desktop is running"
    exit 1
fi

echo ""
echo "Waiting for PostgreSQL to be ready..."
sleep 5

echo ""
echo "Step 3: Running database migrations..."
source venv/bin/activate
python manage.py migrate

if [ $? -ne 0 ]; then
    echo ""
    echo "ERROR: Migrations failed"
    exit 1
fi

echo ""
echo "========================================"
echo "PostgreSQL setup complete!"
echo "========================================"
echo ""
echo "Database: amzpulse_db"
echo "Host: localhost"
echo "Port: 5432"
echo "User: postgres"
echo "Password: postgres"
echo ""
echo "You can now start the Django server:"
echo "  python manage.py runserver"
echo ""

