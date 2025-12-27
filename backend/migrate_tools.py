#!/usr/bin/env python
"""
Script to migrate tools from SQLite tool_links table to PostgreSQL
"""
import os
import sys
import django
import sqlite3

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amzpulse.settings')
django.setup()

from django.conf import settings
import dj_database_url

# Connect to SQLite
sqlite_path = settings.BASE_DIR / 'db.sqlite3'
if not sqlite_path.exists():
    print("[ERROR] SQLite database not found!")
    sys.exit(1)

print("[OK] Connecting to SQLite database...")
conn = sqlite3.connect(sqlite_path)
cursor = conn.cursor()

# Get all tools from SQLite
cursor.execute('SELECT id, name, url, description, category, icon_url, is_active, created_at, updated_at, created_by_id, is_personal FROM tool_links')
tools = cursor.fetchall()
print(f"[OK] Found {len(tools)} tools in SQLite")
conn.close()

# Switch to PostgreSQL
print()
print("[OK] Connecting to PostgreSQL...")
original_db_url = os.environ.get('DATABASE_URL', '')
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/amzpulse_db')
settings.DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'])

# Import Django models
from toollinks.models import ToolLink
from users.models import User
from django.utils import timezone
from datetime import datetime

print("[IMPORT] Importing tools to PostgreSQL...")
imported = 0
skipped = 0

for tool_data in tools:
    tool_id, name, url, description, category, icon_url, is_active, created_at, updated_at, created_by_id, is_personal = tool_data
    
    # Check if tool already exists
    if ToolLink.objects.filter(id=tool_id).exists():
        print(f"  [SKIP] Tool '{name}' (ID: {tool_id}) already exists")
        skipped += 1
        continue
    
    # Get the user
    try:
        user = User.objects.get(id=created_by_id) if created_by_id else None
    except User.DoesNotExist:
        print(f"  [WARN] User ID {created_by_id} not found, skipping tool '{name}'")
        skipped += 1
        continue
    
    # Parse dates
    try:
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00')) if created_at else timezone.now()
        updated = datetime.fromisoformat(updated_at.replace('Z', '+00:00')) if updated_at else timezone.now()
    except:
        created = timezone.now()
        updated = timezone.now()
    
    # Create tool
    try:
        tool = ToolLink.objects.create(
            id=tool_id,
            name=name or '',
            url=url or '',
            description=description or '',
            category=category or 'productivity',
            icon_url=icon_url or None,
            is_active=bool(is_active) if is_active is not None else True,
            created_by=user,
            is_personal=bool(is_personal) if is_personal is not None else False,
        )
        # Set timestamps manually
        tool.created_at = created
        tool.updated_at = updated
        tool.save()
        
        print(f"  [OK] Imported: '{name}' (ID: {tool_id})")
        imported += 1
    except Exception as e:
        print(f"  [ERROR] Failed to import '{name}': {e}")
        skipped += 1

print()
print(f"[SUCCESS] Migration complete!")
print(f"  Imported: {imported} tools")
print(f"  Skipped: {skipped} tools")
print(f"  Total in PostgreSQL: {ToolLink.objects.count()} tools")

