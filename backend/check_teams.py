import sqlite3
import os

db_path = 'db.sqlite3'
if not os.path.exists(db_path):
    print("SQLite database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Check for teams
if 'teams' in [t[0] for t in cursor.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]:
    cursor.execute('SELECT COUNT(*) FROM teams')
    count = cursor.fetchone()[0]
    print(f"Teams in SQLite: {count}")
    
    if count > 0:
        cursor.execute('SELECT id, name, description, created_by_id, created_at FROM teams')
        teams = cursor.fetchall()
        print("\nTeams found:")
        for team in teams:
            print(f"  - ID: {team[0]}, Name: {team[1]}, Created by: {team[3]}")
        
        # Check team members
        cursor.execute('SELECT COUNT(*) FROM team_members')
        member_count = cursor.fetchone()[0]
        print(f"\nTeam members in SQLite: {member_count}")
        
        if member_count > 0:
            cursor.execute('SELECT id, team_id, user_id, role FROM team_members LIMIT 10')
            members = cursor.fetchall()
            print("Sample members:")
            for member in members:
                print(f"  - Team ID: {member[1]}, User ID: {member[2]}, Role: {member[3]}")
else:
    print("teams table not found!")

conn.close()

