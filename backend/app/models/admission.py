from sqlalchemy import Column, String, Integer, Date, Boolean, DateTime, Text, Enum, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class AdmissionStatusEnum(str, enum.Enum):
    applied   = "applied"
    shortlisted = "shortlisted"
    approved  = "approved"
    rejected  = "rejected"
    enrolled  = "enrolled"

class Admission(Base):
    __tablename__ = "admissions"

    id               = Column(Integer, primary_key=True, index=True)
    application_no   = Column(String(50), unique=True, nullable=False, index=True)
    applicant_name   = Column(String(150), nullable=False)
    date_of_birth    = Column(Date, nullable=False)
    gender           = Column(String(10), nullable=False)
    applying_class   = Column(String(50), nullable=False)
    academic_year    = Column(String(20), nullable=False)
    previous_school  = Column(String(200), nullable=True)
    previous_class   = Column(String(50), nullable=True)
    guardian_name    = Column(String(150), nullable=False)
    guardian_phone   = Column(String(20), nullable=False)
    guardian_email   = Column(String(150), nullable=True)
    address          = Column(Text, nullable=True)
    status           = Column(Enum(AdmissionStatusEnum), default=AdmissionStatusEnum.applied)
    remarks          = Column(Text, nullable=True)
    interview_date   = Column(Date, nullable=True)
    approved_by      = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
    updated_at       = Column(DateTime(timezone=True), onupdate=func.now())
