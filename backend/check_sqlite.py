import sqlite3
import os

db_path = 'db.sqlite3'
if not os.path.exists(db_path):
    print("SQLite database not found!")
    exit(1)

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get all tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [t[0] for t in cursor.fetchall()]
print(f"Tables found: {tables}")
print()

# Check for tools
if 'tool_links' in tables:
    cursor.execute('SELECT COUNT(*) FROM tool_links')
    count = cursor.fetchone()[0]
    print(f"Tools in SQLite: {count}")
    
    if count > 0:
        cursor.execute('SELECT * FROM tool_links LIMIT 10')
        tools = cursor.fetchall()
        print(f"\nFound {len(tools)} tools. Sample:")
        # Get column names
        cursor.execute('PRAGMA table_info(tool_links)')
        columns = [col[1] for col in cursor.fetchall()]
        print(f"Columns: {columns}")
        for tool in tools:
            print(f"  - {tool}")
else:
    print("tool_links table not found!")

conn.close()

