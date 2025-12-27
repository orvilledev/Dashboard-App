#!/usr/bin/env python
"""
Script to migrate data from SQLite to PostgreSQL
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amzpulse.settings')
django.setup()

from django.core.management import call_command
from django.conf import settings
import dj_database_url

# Check if SQLite database exists
sqlite_path = settings.BASE_DIR / 'db.sqlite3'
if not sqlite_path.exists():
    print("[ERROR] SQLite database not found!")
    sys.exit(1)

print("[OK] SQLite database found!")
print(f"   Location: {sqlite_path}")
print()

# Temporarily switch to SQLite to export data
original_db_url = os.environ.get('DATABASE_URL', '')
os.environ['DATABASE_URL'] = f'sqlite:///{sqlite_path}'

# Reload database config
settings.DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'])

print("[EXPORT] Exporting data from SQLite...")
try:
    # Export all data to JSON - specifically include toollinks
    with open('data_export.json', 'w', encoding='utf-8') as f:
        call_command('dumpdata', '--natural-foreign', '--natural-primary', 'toollinks', 'users', 'workspace_tasks', 'workspace_teams', 'workspace_documents', stdout=f, exclude=['contenttypes', 'auth.permission', 'admin.logentry'])
    print("[OK] Data exported to data_export.json")
except Exception as e:
    print(f"[ERROR] Error exporting data: {e}")
    sys.exit(1)

# Restore original database URL
if original_db_url:
    os.environ['DATABASE_URL'] = original_db_url
else:
    del os.environ['DATABASE_URL']

# Reload database config to PostgreSQL
settings.DATABASES['default'] = dj_database_url.parse(
    os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/amzpulse_db')
)

print()
print("[IMPORT] Importing data to PostgreSQL...")
try:
    # Import data to PostgreSQL
    with open('data_export.json', 'r', encoding='utf-8') as f:
        call_command('loaddata', 'data_export.json', verbosity=1)
    print("[OK] Data imported to PostgreSQL!")
except Exception as e:
    print(f"[ERROR] Error importing data: {e}")
    print("   You may need to run migrations first: python manage.py migrate")
    sys.exit(1)

print()
print("[SUCCESS] Migration complete!")
print("   Your tools and data have been restored!")

