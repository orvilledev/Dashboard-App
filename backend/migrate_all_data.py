#!/usr/bin/env python
"""
Script to migrate all data from SQLite to PostgreSQL
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
from django.utils import timezone
from datetime import datetime

# Connect to SQLite
sqlite_path = settings.BASE_DIR / 'db.sqlite3'
if not sqlite_path.exists():
    print("[ERROR] SQLite database not found!")
    sys.exit(1)

print("[OK] Connecting to SQLite database...")
conn = sqlite3.connect(sqlite_path)
cursor = conn.cursor()

# Switch to PostgreSQL
print("[OK] Connecting to PostgreSQL...")
os.environ['DATABASE_URL'] = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/amzpulse_db')
settings.DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'])

# Import Django models
from users.models import User
from toollinks.models import ToolLink

# Step 1: Migrate Users
print()
print("=" * 50)
print("STEP 1: Migrating Users")
print("=" * 50)
cursor.execute('SELECT id, username, email, first_name, last_name, clerk_id, avatar_url, is_admin, date_joined FROM users')
users_data = cursor.fetchall()
print(f"[OK] Found {len(users_data)} users in SQLite")

imported_users = 0
for user_data in users_data:
    user_id, username, email, first_name, last_name, clerk_id, avatar_url, is_admin, date_joined = user_data
    
    if User.objects.filter(id=user_id).exists():
        print(f"  [SKIP] User '{username}' (ID: {user_id}) already exists")
        continue
    
    try:
        # Parse date
        try:
            joined = datetime.fromisoformat(date_joined.replace('Z', '+00:00')) if date_joined else timezone.now()
        except:
            joined = timezone.now()
        
        user = User.objects.create(
            id=user_id,
            username=username or f'user_{user_id}',
            email=email or '',
            first_name=first_name or '',
            last_name=last_name or '',
            clerk_id=clerk_id or '',
            avatar_url=avatar_url or '',
            is_admin=bool(is_admin) if is_admin is not None else False,
        )
        user.date_joined = joined
        user.save()
        
        print(f"  [OK] Imported user: '{username}' (ID: {user_id})")
        imported_users += 1
    except Exception as e:
        print(f"  [ERROR] Failed to import user '{username}': {e}")

print(f"[OK] Imported {imported_users} users")

# Step 2: Migrate Tools
print()
print("=" * 50)
print("STEP 2: Migrating Tools")
print("=" * 50)
cursor.execute('SELECT id, name, url, description, category, icon_url, is_active, created_at, updated_at, created_by_id, is_personal FROM tool_links')
tools = cursor.fetchall()
print(f"[OK] Found {len(tools)} tools in SQLite")

imported_tools = 0
for tool_data in tools:
    tool_id, name, url, description, category, icon_url, is_active, created_at, updated_at, created_by_id, is_personal = tool_data
    
    if ToolLink.objects.filter(id=tool_id).exists():
        print(f"  [SKIP] Tool '{name}' (ID: {tool_id}) already exists")
        continue
    
    # Get the user
    user = None
    if created_by_id:
        try:
            user = User.objects.get(id=created_by_id)
        except User.DoesNotExist:
            print(f"  [WARN] User ID {created_by_id} not found for tool '{name}', creating without user")
    
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
        imported_tools += 1
    except Exception as e:
        print(f"  [ERROR] Failed to import '{name}': {e}")

conn.close()

print()
print("=" * 50)
print("[SUCCESS] Migration Complete!")
print("=" * 50)
print(f"  Users imported: {imported_users}")
print(f"  Tools imported: {imported_tools}")
print(f"  Total users in PostgreSQL: {User.objects.count()}")
print(f"  Total tools in PostgreSQL: {ToolLink.objects.count()}")

