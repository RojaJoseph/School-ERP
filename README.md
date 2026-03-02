# 🎓 School ERP System

A full-stack, production-ready School Management ERP built with **FastAPI** (Python) and **Next.js 14** (TypeScript).

---

## 📦 Tech Stack

| Layer     | Technology                                  |
|-----------|---------------------------------------------|
| Backend   | FastAPI, SQLAlchemy, Pydantic v2, JWT Auth  |
| Database  | PostgreSQL (SQLite for local dev)           |
| Frontend  | Next.js 14, TypeScript, Tailwind CSS        |
| State     | Zustand                                     |
| Charts    | Recharts                                    |
| Deploy    | Docker, Docker Compose, Nginx               |

---

## 🚀 Quick Start (Local Development)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt

# Set up .env (already configured for SQLite by default)
# Run migrations + start server
uvicorn app.main:app --reload --port 8000

# Seed default users (first time only)
python -m scripts.seed
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## 🐳 Docker Deployment

```bash
# 1. Copy and configure environment
cp .env.example .env
# Edit .env — change passwords and SECRET_KEY!

# 2. Start all services
docker-compose up -d

# 3. Seed data (first run only)
docker-compose exec backend python -m scripts.seed

# 4. Access
#    App:      http://localhost
#    API Docs: http://localhost/api/docs
```

---

## 🔑 Default Login Accounts

| Role        | Email                 | Password       |
|-------------|-----------------------|----------------|
| Super Admin | admin@school.com      | Admin@123      |
| Principal   | principal@school.com  | Principal@123  |
| Teacher     | teacher@school.com    | Teacher@123    |
| Accountant  | accounts@school.com   | Accounts@123   |

> ⚠️ Change all passwords after first login in production!

---

## 📋 Modules

| Module          | Features                                                        |
|-----------------|-----------------------------------------------------------------|
| **Dashboard**   | KPI cards, weekly attendance chart, monthly fee chart, quick actions |
| **Students**    | Full CRUD, photo upload, bulk CSV import, export, profile page  |
| **Admissions**  | Application tracking, status workflow, interview scheduling     |
| **Attendance**  | Daily class-wise marking, bulk save, per-student summary        |
| **Exams**       | Exam management, bulk marks entry, grade calculation, results   |
| **Fees**        | Fee structures, payment collection, receipts, email on payment  |
| **HR & Payroll**| Employee management, leave requests, payroll generation         |
| **Library**     | Book catalog, issue/return tracking, fines                      |
| **Inventory**   | Stock management, transactions, low-stock alerts                |
| **Transport**   | Route management, student transport assignment                  |
| **Timetable**   | Interactive weekly grid, per-class schedule, color-coded subjects |
| **Reports**     | Analytics dashboard, charts, export CSV/Excel/PDF               |
| **Communication**| Notifications, internal messaging, inbox/sent                  |
| **Settings**    | Profile, password change, appearance, system info               |

---

## 🔐 Role-Based Access Control

| Role            | Access                                              |
|-----------------|-----------------------------------------------------|
| `super_admin`   | Full access to everything                           |
| `school_admin`  | All modules except system configuration             |
| `teacher`       | Attendance, Exams, Library, Communication           |
| `accountant`    | Fees, Reports                                       |
| `hr_manager`    | HR & Payroll                                        |
| `librarian`     | Library only                                        |
| `transport_mgr` | Transport only                                      |

Menu items are automatically hidden based on the logged-in user's role.

---

## 📁 Project Structure

```
ERP_School/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # 13 route modules
│   │   ├── core/                # config, security, email, dependencies
│   │   ├── crud/                # database operations
│   │   ├── db/                  # session, base
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   └── main.py              # FastAPI app with lifespan, middleware
│   ├── scripts/seed.py          # Default users + sample data
│   ├── uploads/                 # Student photos, documents
│   ├── .env                     # Environment variables
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── app/
│   │   ├── (auth)/login/        # Login page
│   │   └── (dashboard)/         # All protected pages
│   │       ├── dashboard/       # Main dashboard
│   │       ├── students/        # List + [id] profile
│   │       ├── admissions/
│   │       ├── attendance/
│   │       ├── exams/
│   │       ├── fees/
│   │       ├── hr/
│   │       ├── library/
│   │       ├── inventory/
│   │       ├── transport/
│   │       ├── timetable/
│   │       ├── reports/
│   │       ├── communication/
│   │       └── settings/
│   ├── components/
│   │   ├── layout/              # Navbar, Sidebar (responsive + RBAC)
│   │   ├── ui/                  # Modal, Pagination, Spinner, ConfirmDialog
│   │   └── shared/              # StatsCard, PageHeader, EmptyState
│   ├── hooks/                   # useDebounce, usePagination, useApi
│   ├── lib/                     # api.ts, utils.ts, exportUtils.ts
│   ├── store/                   # Zustand auth store
│   ├── types/                   # TypeScript interfaces
│   ├── .env.local
│   ├── Dockerfile
│   └── next.config.js
│
├── nginx/nginx.conf             # Reverse proxy config
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 📧 Email Notifications

Set in `backend/.env`:
```env
SMTP_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your-app-password   # Gmail App Password, not your account password
SMTP_FROM=noreply@yourschool.com
```

Emails are sent automatically for:
- Fee payment receipts → guardian email
- Welcome email on new user creation
- Attendance alerts
- Leave request decisions
- Exam results

---

## 📤 Bulk Student Import (CSV)

1. Go to **Students** → click **Import CSV**
2. Download the template
3. Fill in student data and save as `.csv`
4. Upload — results shown row by row (success/skipped/error)

Required columns: `first_name`, `last_name`, `date_of_birth`, `gender`, `class_name`, `academic_year`, `guardian_name`, `guardian_phone`

---

## 📄 Export Options

- **CSV** — comma-separated, opens in Excel/Sheets
- **Excel (.xlsx)** — formatted spreadsheet via SheetJS
- **PDF** — browser print dialog with styled layout

Available on: Students page, Reports page, Timetable page

---

## 🏥 Health Check

```bash
curl http://localhost:8000/health
# {"status":"healthy","database":"healthy","app":"School ERP"}
```

---

## 🔧 API Documentation

- Swagger UI: `http://localhost:8000/api/docs`
- ReDoc:      `http://localhost:8000/api/redoc`
