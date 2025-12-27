# AMZPulse - Workspace Management App

A modern workspace management application that helps teams organize their tools, documents, tasks, and collaboration in one centralized hub.

## Features

- **Tool Links**: Organize and access all essential tools in one place
- **Document Management**: Upload, share, and manage documents with S3 integration
- **Task Management**: Create, assign, and track tasks with status updates
- **Team Collaboration**: Invite members, manage roles, and collaborate effectively
- **Admin Controls**: Role-based access for viewing and editing content

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- TanStack Query (data fetching)
- React Router (navigation)
- Clerk (authentication)

### Backend
- Django 4.2
- Django REST Framework
- PostgreSQL (database)
- Celery + Redis (background jobs)
- AWS S3 (document storage)

### Deployment
- Frontend: Vercel
- Backend: Render
- Database: PostgreSQL (Render)
- Cache/Queue: Redis (Render)

## Project Structure

```
Dashboard-App/
├── frontend/                    # React + TypeScript frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom hooks
│   │   ├── api/                 # API client
│   │   └── lib/                 # Utilities
│   └── package.json
│
├── backend/                     # Django backend
│   ├── amzpulse/                # Django project settings
│   ├── users/                   # User management
│   ├── toollinks/               # Tool links app
│   ├── workspace_documents/     # Document management
│   ├── workspace_tasks/         # Task management
│   ├── workspace_teams/         # Team management
│   ├── core_api/                # API routing
│   └── requirements.txt
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (optional, SQLite for development)
- Redis (optional, for Celery)

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Create a `.env` file:
```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
VITE_API_URL=http://localhost:8000/api/v1
```

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Create a `.env` file:
```env
DEBUG=true
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
CLERK_SECRET_KEY=your-clerk-secret
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_STORAGE_BUCKET_NAME=your-bucket-name
```

### Running Celery (optional)

```bash
# Start worker
celery -A amzpulse worker --loglevel=info

# Start beat scheduler
celery -A amzpulse beat --loglevel=info
```

## API Endpoints

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/v1/users/me/` | GET | Current user profile |
| `/api/v1/tools/` | GET, POST | Tool links (CRUD for admins) |
| `/api/v1/documents/` | GET, POST | Documents |
| `/api/v1/documents/request_upload/` | POST | Get S3 presigned URL |
| `/api/v1/tasks/` | GET, POST | Tasks (CRUD for admins) |
| `/api/v1/members/` | GET, POST | Team members |
| `/api/v1/invites/` | GET, POST | Team invitations |

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Add environment variables:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_API_URL`

### Backend (Render)

1. Connect your GitHub repository to Render
2. Use the `render.yaml` blueprint or create services manually:
   - Web Service: `gunicorn amzpulse.wsgi:application`
   - Worker: `celery -A amzpulse worker`
   - PostgreSQL database
   - Redis instance

3. Set environment variables as specified in `render.yaml`

## Design System

- **Font**: Playfair Display (headings), Lora (body)
- **Colors**: Warm neutrals (cream, charcoal, muted gold)
- **Border Radius**: Rounded corners (8-16px)
- **Shadows**: Soft shadows for elevation

## License

MIT License

