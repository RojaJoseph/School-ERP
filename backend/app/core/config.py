from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # ── Database ──────────────────────────────────────
    DATABASE_URL: str

    # ── Auth ──────────────────────────────────────────
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int   = 7

    # ── App ───────────────────────────────────────────
    DEBUG:       bool = False
    APP_NAME:    str  = "School ERP"
    APP_VERSION: str  = "2.0.0"

    # ── CORS ──────────────────────────────────────────
    FRONTEND_URL: str = "http://localhost:3000"

    @property
    def ALLOWED_ORIGINS(self) -> List[str]:
        origins = [self.FRONTEND_URL, "http://localhost:3000", "http://127.0.0.1:3000"]
        if self.DEBUG:
            origins += ["http://localhost:3001", "http://localhost:5173"]
        return list(set(origins))

    # ── File Upload ───────────────────────────────────
    MAX_UPLOAD_SIZE_MB: int = 5
    UPLOAD_DIR: str         = "uploads"

    # ── School Location ──────────────────────────────
    SCHOOL_LATITUDE:      float = 11.0168
    SCHOOL_LONGITUDE:     float = 76.9558
    SCHOOL_RADIUS_METERS: int   = 100

    # ── Teacher Attendance ───────────────────────────
    ATTENDANCE_ONTIME_BEFORE: str   = "09:00"
    ATTENDANCE_LATE_BEFORE:   str   = "10:00"
    FACE_MATCH_THRESHOLD:     float = 0.55

    # ── SMTP / Email ──────────────────────────────────
    SMTP_ENABLED:  bool = False
    SMTP_HOST:     str  = "smtp.gmail.com"
    SMTP_PORT:     int  = 587
    SMTP_USER:     str  = ""
    SMTP_PASSWORD: str  = ""
    SMTP_FROM:     str  = "noreply@school.com"

    class Config:
        env_file = ".env"
        extra    = "ignore"


settings = Settings()
