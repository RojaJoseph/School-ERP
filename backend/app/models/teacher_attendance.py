from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class TeacherAttendanceStatusEnum(str, enum.Enum):
    present = "present"
    late    = "late"
    absent  = "absent"
    holiday = "holiday"
    leave   = "leave"

class TeacherFaceProfile(Base):
    """Stores the face embedding for each teacher/user."""
    __tablename__ = "teacher_face_profiles"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    photo_path      = Column(String(255), nullable=True)       # stored registration photo
    embedding       = Column(Text, nullable=True)              # JSON list of 128 floats (face-api descriptor)
    is_active       = Column(Boolean, default=True)
    registered_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())

class TeacherAttendance(Base):
    """Daily teacher attendance record."""
    __tablename__ = "teacher_attendance"

    id              = Column(Integer, primary_key=True, index=True)
    user_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date            = Column(Date, nullable=False, index=True)
    status          = Column(Enum(TeacherAttendanceStatusEnum), default=TeacherAttendanceStatusEnum.present)
    check_in_time   = Column(String(10), nullable=True)        # HH:MM
    check_out_time  = Column(String(10), nullable=True)
    latitude        = Column(Float, nullable=True)
    longitude       = Column(Float, nullable=True)
    distance_meters = Column(Float, nullable=True)             # distance from school
    face_confidence = Column(Float, nullable=True)             # 0.0 - 1.0
    selfie_path     = Column(String(255), nullable=True)       # captured selfie
    note            = Column(Text, nullable=True)
    marked_by       = Column(String(50), default="face")       # face / manual / admin
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
