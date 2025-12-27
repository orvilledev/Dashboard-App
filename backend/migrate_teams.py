#!/usr/bin/env python
"""
Script to migrate teams, team members, and team invites from SQLite to PostgreSQL
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
from workspace_teams.models import Team, TeamMember, TeamInvite

# Step 1: Migrate Teams
print()
print("=" * 50)
print("STEP 1: Migrating Teams")
print("=" * 50)
cursor.execute('SELECT id, name, description, created_by_id, created_at, updated_at FROM teams')
teams_data = cursor.fetchall()
print(f"[OK] Found {len(teams_data)} teams in SQLite")

imported_teams = 0
for team_data in teams_data:
    team_id, name, description, created_by_id, created_at, updated_at = team_data
    
    if Team.objects.filter(id=team_id).exists():
        print(f"  [SKIP] Team '{name}' (ID: {team_id}) already exists")
        continue
    
    # Get the user
    user = None
    if created_by_id:
        try:
            user = User.objects.get(id=created_by_id)
        except User.DoesNotExist:
            print(f"  [WARN] User ID {created_by_id} not found for team '{name}', creating without user")
    
    # Parse dates
    try:
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00')) if created_at else timezone.now()
        updated = datetime.fromisoformat(updated_at.replace('Z', '+00:00')) if updated_at else timezone.now()
    except:
        created = timezone.now()
        updated = timezone.now()
    
    # Create team
    try:
        team = Team.objects.create(
            id=team_id,
            name=name or '',
            description=description or '',
            created_by=user,
        )
        # Set timestamps manually
        team.created_at = created
        team.updated_at = updated
        team.save()
        
        print(f"  [OK] Imported: '{name}' (ID: {team_id})")
        imported_teams += 1
    except Exception as e:
        print(f"  [ERROR] Failed to import '{name}': {e}")

print(f"[OK] Imported {imported_teams} teams")

# Step 2: Migrate Team Members
print()
print("=" * 50)
print("STEP 2: Migrating Team Members")
print("=" * 50)
cursor.execute('SELECT id, team_id, user_id, role, joined_at FROM team_members')
members_data = cursor.fetchall()
print(f"[OK] Found {len(members_data)} team members in SQLite")

imported_members = 0
for member_data in members_data:
    member_id, team_id, user_id, role, joined_at = member_data
    
    if TeamMember.objects.filter(id=member_id).exists():
        print(f"  [SKIP] Member (ID: {member_id}) already exists")
        continue
    
    # Get team and user
    try:
        team = Team.objects.get(id=team_id)
    except Team.DoesNotExist:
        print(f"  [WARN] Team ID {team_id} not found, skipping member")
        continue
    
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        print(f"  [WARN] User ID {user_id} not found, skipping member")
        continue
    
    # Parse date
    try:
        joined = datetime.fromisoformat(joined_at.replace('Z', '+00:00')) if joined_at else timezone.now()
    except:
        joined = timezone.now()
    
    # Create member
    try:
        member = TeamMember.objects.create(
            id=member_id,
            team=team,
            user=user,
            role=role or 'member',
        )
        # Set timestamp manually
        member.joined_at = joined
        member.save()
        
        print(f"  [OK] Imported: User {user_id} -> Team '{team.name}' ({role})")
        imported_members += 1
    except Exception as e:
        print(f"  [ERROR] Failed to import member: {e}")

print(f"[OK] Imported {imported_members} team members")

# Step 3: Migrate Team Invites (if any)
print()
print("=" * 50)
print("STEP 3: Migrating Team Invites")
print("=" * 50)
cursor.execute('SELECT id, team_id, email, invited_by_id, status, created_at, expires_at FROM team_invites')
invites_data = cursor.fetchall()
print(f"[OK] Found {len(invites_data)} team invites in SQLite")

imported_invites = 0
for invite_data in invites_data:
    invite_id, team_id, email, invited_by_id, status, created_at, expires_at = invite_data
    
    if TeamInvite.objects.filter(id=invite_id).exists():
        print(f"  [SKIP] Invite (ID: {invite_id}) already exists")
        continue
    
    # Get team and user
    try:
        team = Team.objects.get(id=team_id)
    except Team.DoesNotExist:
        print(f"  [WARN] Team ID {team_id} not found, skipping invite")
        continue
    
    user = None
    if invited_by_id:
        try:
            user = User.objects.get(id=invited_by_id)
        except User.DoesNotExist:
            print(f"  [WARN] User ID {invited_by_id} not found for invite")
    
    # Parse dates
    try:
        created = datetime.fromisoformat(created_at.replace('Z', '+00:00')) if created_at else timezone.now()
        expires = datetime.fromisoformat(expires_at.replace('Z', '+00:00')) if expires_at else None
    except:
        created = timezone.now()
        expires = None
    
    # Create invite
    try:
        invite = TeamInvite.objects.create(
            id=invite_id,
            team=team,
            email=email or '',
            invited_by=user,
            status=status or 'pending',
            expires_at=expires,
        )
        # Set timestamp manually
        invite.created_at = created
        invite.save()
        
        print(f"  [OK] Imported: Invite for {email} -> Team '{team.name}'")
        imported_invites += 1
    except Exception as e:
        print(f"  [ERROR] Failed to import invite: {e}")

conn.close()

print()
print("=" * 50)
print("[SUCCESS] Migration Complete!")
print("=" * 50)
print(f"  Teams imported: {imported_teams}")
print(f"  Team members imported: {imported_members}")
print(f"  Team invites imported: {imported_invites}")
print(f"  Total teams in PostgreSQL: {Team.objects.count()}")
print(f"  Total members in PostgreSQL: {TeamMember.objects.count()}")

