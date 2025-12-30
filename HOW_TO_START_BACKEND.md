# 🚨 HOW TO START THE BACKEND SERVER

## The Problem
Your frontend shows "Failed to load tools" because the backend server is not running.

## ✅ EASIEST SOLUTION - Double Click This File:
**`backend/START_SERVER.bat`**

Just double-click this file and a window will open with the server running!

---

## 📋 Manual Steps (If the .bat file doesn't work):

### Step 1: Open Command Prompt or PowerShell
- Press `Windows Key + R`
- Type `cmd` and press Enter
- OR press `Windows Key + X` and select "Terminal"

### Step 2: Navigate to Backend Folder
Copy and paste this:
```cmd
cd C:\Users\Administrator\Desktop\Dashboard-App\backend
```

### Step 3: Activate Virtual Environment
```cmd
venv\Scripts\activate
```

### Step 4: Start Server
```cmd
python manage.py runserver
```

### Step 5: You Should See:
```
Starting development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.
```

### Step 6: KEEP THE WINDOW OPEN!
**DO NOT CLOSE** the command window. The server must stay running.

### Step 7: Refresh Your Browser
Go back to your frontend and refresh the page. The error should be gone!

---

## 🎯 One-Line Command (Copy All):
```cmd
cd C:\Users\Administrator\Desktop\Dashboard-App\backend && venv\Scripts\activate && python manage.py runserver
```

---

## ❌ Troubleshooting:

### Error: "python is not recognized"
**Solution:** Make sure you activated the virtual environment:
```cmd
venv\Scripts\activate
```

### Error: "ModuleNotFoundError: No module named 'django'"
**Solution:** Install dependencies:
```cmd
pip install -r requirements.txt
```

### Error: "Port 8000 already in use"
**Solution:** 
1. Close any other Django servers
2. Or use a different port: `python manage.py runserver 8001`

### Error: "Database errors"
**Solution:** Run migrations:
```cmd
python manage.py migrate
```

---

## ✅ Verify Server is Running:

1. Open your browser
2. Go to: http://localhost:8000/api/v1/
3. You should see the API documentation page

If you see the API page, the server is working! Now refresh your frontend.

---

## 📝 Important Notes:

- **The backend server MUST be running** for the frontend to work
- **Keep the command window open** while using the app
- If you close the window, the server stops and errors return
- You can minimize the window, but don't close it

---

## 🆘 Still Having Issues?

If you're still getting errors after following these steps, please:
1. Check the command window for error messages
2. Share the error message with me
3. I'll help you fix it!

