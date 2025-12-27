#!/bin/bash
echo "Starting Django Backend Server..."
cd "$(dirname "$0")"
source venv/bin/activate
python manage.py runserver

