import logging
import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.session import Base, engine

# Import all models so SQLAlchemy creates all tables
from app.models import (
    user, student, admission, attendance,
    exam, fee, payroll, transport,
    library, inventory, communication, timetable
)

# ── Logging ──────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO if not settings.DEBUG else logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("school_erp")


# ── Lifespan ─────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logger.info("🚀 Starting School ERP API...")
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created/verified")
    except Exception as e:
        logger.error(f"❌ DB init failed: {e}")
    yield
    # Shutdown
    logger.info("🛑 Shutting down School ERP API")


# ── App ───────────────────────────────────────────────
app = FastAPI(
    title=settings.APP_NAME,
    version="2.0.0",
    description="Complete School Management ERP System",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
    redirect_slashes=False,
)


# ── Middleware ────────────────────────────────────────
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_id_timing_middleware(request: Request, call_next):
    """Add request ID + log request timing."""
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    start = time.time()
    try:
        response = await call_next(request)
        duration = round((time.time() - start) * 1000, 2)
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration}ms"
        if settings.DEBUG:
            logger.debug(f"[{request_id}] {request.method} {request.url.path} → {response.status_code} ({duration}ms)")
        return response
    except Exception as exc:
        duration = round((time.time() - start) * 1000, 2)
        logger.error(f"[{request_id}] Unhandled error: {exc} ({duration}ms)")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error", "request_id": request_id},
        )


# ── Global Exception Handlers ────────────────────────
@app.exception_handler(SQLAlchemyError)
async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.error(f"Database error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database error occurred. Please try again."},
    )


@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": str(exc)},
    )


# ── Static Files ──────────────────────────────────────
import os
os.makedirs("uploads/students", exist_ok=True)
os.makedirs("uploads/assignments", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)
os.makedirs("uploads/teacher_selfies", exist_ok=True)
os.makedirs("uploads/teacher_faces", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# ── Routes ────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ── Health & Root ─────────────────────────────────────
@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "version": "2.0.0",
        "status": "running",
        "docs": "/api/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """Production health check endpoint."""
    try:
        from app.db.session import SessionLocal
        db = SessionLocal()
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except Exception as e:
        logger.warning(f"DB health check failed: {e}")
        db_status = "unhealthy"

    return {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "database": db_status,
        "app": settings.APP_NAME,
    }
