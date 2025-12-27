# PostgreSQL Setup Guide

This guide will help you set up PostgreSQL for the AMZPulse Dashboard App.

## Option 1: Using Docker (Recommended - Easiest)

### Prerequisites
- Docker Desktop installed on your system

### Steps

1. **Start PostgreSQL and Redis using Docker Compose:**
   ```bash
   cd backend
   docker-compose up -d
   ```

2. **Create a `.env` file in the `backend` directory:**
   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/amzpulse_db
   REDIS_URL=redis://localhost:6379/0
   ```

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Create a superuser (optional):**
   ```bash
   python manage.py createsuperuser
   ```

That's it! PostgreSQL is now running and ready to use.

### Stop Docker containers:
```bash
docker-compose down
```

### View logs:
```bash
docker-compose logs -f postgres
```

---

## Option 2: Install PostgreSQL Locally

### Windows

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the installer
   - Run the installer and follow the setup wizard
   - Remember the password you set for the `postgres` user

2. **Create a database:**
   ```sql
   -- Open pgAdmin or psql command line
   CREATE DATABASE amzpulse_db;
   ```

3. **Create a `.env` file in the `backend` directory:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/amzpulse_db
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

### macOS

1. **Install using Homebrew:**
   ```bash
   brew install postgresql@15
   brew services start postgresql@15
   ```

2. **Create a database:**
   ```bash
   createdb amzpulse_db
   ```

3. **Create a `.env` file:**
   ```env
   DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/amzpulse_db
   ```

4. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

### Linux (Ubuntu/Debian)

1. **Install PostgreSQL:**
   ```bash
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   ```

2. **Start PostgreSQL service:**
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

3. **Create a database:**
   ```bash
   sudo -u postgres createdb amzpulse_db
   ```

4. **Create a `.env` file:**
   ```env
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/amzpulse_db
   ```

5. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

---

## Verify PostgreSQL Connection

You can test the connection by running:

```bash
python manage.py dbshell
```

If successful, you'll see the PostgreSQL prompt.

---

## Migrating from SQLite to PostgreSQL

If you have existing data in SQLite:

1. **Export data from SQLite:**
   ```bash
   python manage.py dumpdata > data.json
   ```

2. **Switch to PostgreSQL** (update `.env` file)

3. **Run migrations:**
   ```bash
   python manage.py migrate
   ```

4. **Load data into PostgreSQL:**
   ```bash
   python manage.py loaddata data.json
   ```

---

## Troubleshooting

### Connection Refused
- Make sure PostgreSQL is running
- Check if the port 5432 is correct
- Verify the database name exists

### Authentication Failed
- Check username and password in DATABASE_URL
- Verify PostgreSQL user permissions

### Database Does Not Exist
- Create the database manually or let Django create it (if user has permissions)

---

## Environment Variables

The `.env` file should contain at minimum:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/dbname
```

Format: `postgresql://[user]:[password]@[host]:[port]/[database]`

