# Quick Start: PostgreSQL Setup

PostgreSQL has been configured for your project! Follow these steps to get it running.

## ✅ What's Already Done

- ✅ PostgreSQL configuration added to `.env` file
- ✅ Docker Compose file created
- ✅ Setup scripts created

## 🚀 Next Steps

### Option 1: Using Docker (Recommended)

1. **Start Docker Desktop**
   - Make sure Docker Desktop is running on your system
   - Wait for it to fully start (whale icon in system tray)

2. **Run the setup script:**
   ```bash
   cd backend
   setup_postgres.bat
   ```
   
   Or manually:
   ```bash
   docker-compose up -d postgres
   python manage.py migrate
   ```

3. **Verify it's working:**
   ```bash
   python manage.py dbshell
   ```
   You should see the PostgreSQL prompt.

### Option 2: Install PostgreSQL Locally

If you prefer not to use Docker:

1. **Install PostgreSQL:**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - macOS: `brew install postgresql@15`
   - Linux: `sudo apt install postgresql postgresql-contrib`

2. **Create the database:**
   ```sql
   CREATE DATABASE amzpulse_db;
   ```

3. **Update `.env` file:**
   ```env
   DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/amzpulse_db
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

## 📝 Current Configuration

Your `.env` file is configured with:
- **Database URL**: `postgresql://postgres:postgres@localhost:5432/amzpulse_db`
- **Redis URL**: `redis://localhost:6379/0`

## 🔍 Verify Connection

Test the database connection:
```bash
python manage.py check --database default
```

## 🛠️ Useful Commands

**Start PostgreSQL (Docker):**
```bash
docker-compose up -d postgres
```

**Stop PostgreSQL (Docker):**
```bash
docker-compose down
```

**View PostgreSQL logs:**
```bash
docker-compose logs -f postgres
```

**Access PostgreSQL shell:**
```bash
python manage.py dbshell
```

**Run migrations:**
```bash
python manage.py migrate
```

**Create superuser:**
```bash
python manage.py createsuperuser
```

## ⚠️ Troubleshooting

**Docker Desktop not running:**
- Start Docker Desktop application
- Wait for it to fully initialize
- Try again

**Port 5432 already in use:**
- Another PostgreSQL instance might be running
- Stop it or change the port in `docker-compose.yml`

**Connection refused:**
- Make sure PostgreSQL container is running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

## 📚 More Information

See `POSTGRES_SETUP.md` for detailed setup instructions.

