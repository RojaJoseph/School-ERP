# School ERP - Docker Commands

## Quick Start
```bash
# 1. Clone & setup env
cp .env.example .env
# Edit .env with your passwords/secrets

# 2. Start everything
docker-compose up -d

# 3. Seed initial data (first time only)
docker-compose exec backend python -m scripts.seed

# 4. Access the app
# Frontend: http://localhost
# API Docs: http://localhost/api/docs
# API Direct: http://localhost:8000/api/docs
```

## Common Commands
```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart a service
docker-compose restart backend

# Stop everything
docker-compose down

# Stop + remove volumes (DELETES ALL DATA)
docker-compose down -v

# Rebuild after code changes
docker-compose up -d --build backend
docker-compose up -d --build frontend
```

## Default Login Credentials
| Role        | Email                     | Password       |
|-------------|---------------------------|----------------|
| Super Admin | admin@school.com          | Admin@123      |
| Principal   | principal@school.com      | Principal@123  |
| Teacher     | teacher@school.com        | Teacher@123    |
| Accountant  | accounts@school.com       | Accounts@123   |
