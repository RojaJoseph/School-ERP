from sqlalchemy import Column, String, Integer, Date, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class AttendanceStatusEnum(str, enum.Enum):
    present  = "present"
    absent   = "absent"
    late     = "late"
    leave    = "leave"
    holiday  = "holiday"

class Attendance(Base):
    __tablename__ = "attendance"

    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    class_name  = Column(String(50), nullable=False)
    section     = Column(String(10), nullable=True)
    date        = Column(Date, nullable=False)
    status      = Column(Enum(AttendanceStatusEnum), nullable=False)
    remarks     = Column(String(255), nullable=True)
    marked_by   = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
