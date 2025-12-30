# Starting the Backend Server

The backend server needs to be running for the frontend to work properly.

## Quick Start

### Windows:
```bash
cd backend
.\venv\Scripts\activate
python manage.py runserver
```

Or use the batch file:
```bash
cd backend
.\start_server.bat
```

### Linux/Mac:
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

Or use the shell script:
```bash
cd backend
chmod +x start_server.sh
./start_server.sh
```

## Verify Server is Running

Once started, you should see:
```
Starting development server at http://127.0.0.1:8000/
```

You can verify it's working by visiting:
- http://localhost:8000/api/v1/ (API root)
- http://localhost:8000/admin/ (Admin panel)

## Troubleshooting

1. **Port 8000 already in use:**
   - Stop any other Django servers running on port 8000
   - Or use a different port: `python manage.py runserver 8001`

2. **Virtual environment not activated:**
   - Make sure you activate the virtual environment first
   - Windows: `.\venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

3. **Dependencies not installed:**
   - Run: `pip install -r requirements.txt`

4. **Database migrations needed:**
   - Run: `python manage.py migrate`

