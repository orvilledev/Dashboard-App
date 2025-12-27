#!/usr/bin/env python
"""
Fix PostgreSQL sequences after data migration.
This ensures auto-increment IDs work correctly after importing data with explicit IDs.
"""
import os
import sys
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'amzpulse.settings')
django.setup()

from django.db import connection
from django.db.models import Max
from toollinks.models import ToolLink
from users.models import User
from workspace_tasks.models import Task
from workspace_teams.models import Team, TeamMember
from workspace_documents.models import Document

def fix_sequence(table_name, model_class):
    """Fix the sequence for a given table."""
    try:
        # Get the max ID from the table
        max_id = model_class.objects.aggregate(max_id=Max('id'))['max_id'] or 0
        
        if max_id > 0:
            # Set the sequence to the max ID (or max_id + 1 to be safe)
            with connection.cursor() as cursor:
                cursor.execute(f"SELECT setval('{table_name}_id_seq', {max_id}, true)")
            print(f"[OK] Fixed {table_name}_id_seq: set to {max_id}")
            return True
        else:
            print(f"[SKIP] {table_name}: no records found")
            return False
    except Exception as e:
        print(f"[ERROR] Failed to fix {table_name}: {e}")
        return False

print("=" * 50)
print("Fixing PostgreSQL Sequences")
print("=" * 50)
print()

# Fix sequences for all tables
tables_fixed = 0

if fix_sequence('tool_links', ToolLink):
    tables_fixed += 1

if fix_sequence('users', User):
    tables_fixed += 1

if fix_sequence('tasks', Task):
    tables_fixed += 1

if fix_sequence('teams', Team):
    tables_fixed += 1

if fix_sequence('team_members', TeamMember):
    tables_fixed += 1

if fix_sequence('documents', Document):
    tables_fixed += 1

print()
print("=" * 50)
print(f"[SUCCESS] Fixed {tables_fixed} sequences")
print("=" * 50)
print()
print("You can now create new tools without ID conflicts!")

