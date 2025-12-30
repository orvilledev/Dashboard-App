# Quick Fix: Start Backend Server

## The Problem
The backend server needs to be running for the frontend to work. Currently, it's not running.

## Solution: Start the Server Manually

### Option 1: Use the Debug Script (Recommended)
1. Open a **new** PowerShell or Command Prompt window
2. Navigate to the backend folder:
   ```bash
   cd C:\Users\Administrator\Desktop\Dashboard-App\backend
   ```
3. Run the debug startup script:
   ```bash
   .\start_server_debug.bat
   ```

This script will:
- ✅ Check if everything is configured correctly
- ✅ Show any errors clearly
- ✅ Start the server with visible output

### Option 2: Manual Start
1. Open PowerShell or Command Prompt
2. Run these commands one by one:
   ```bash
   cd C:\Users\Administrator\Desktop\Dashboard-App\backend
   .\venv\Scripts\activate
   python manage.py runserver
   ```

## What You Should See

When the server starts successfully, you'll see:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

**Keep this window open!** The server must stay running for the frontend to work.

## Verify It's Working

Once you see the "Starting development server" message:
1. Open your browser
2. Go to: http://localhost:8000/api/v1/
3. You should see the API documentation page

## Then Refresh Your Frontend

After the backend is running:
1. Go back to your frontend application
2. Click "Try Again" or refresh the page
3. The error should be gone!

## Common Issues

### "Port 8000 already in use"
- Another server is already running on port 8000
- Close that window/process first
- Or use a different port: `python manage.py runserver 8001`

### "Module not found" or "Django not installed"
- Make sure you activated the virtual environment: `.\venv\Scripts\activate`
- Install dependencies: `pip install -r requirements.txt`

### "Database errors"
- Run migrations: `python manage.py migrate`

