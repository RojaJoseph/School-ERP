from sqlalchemy import Column, Integer, String, Boolean, Time
from app.db.session import Base

class TimetableEntry(Base):
    __tablename__ = "timetable"

    id           = Column(Integer, primary_key=True, index=True)
    class_name   = Column(String(10), nullable=False, index=True)
    section      = Column(String(5), default="A")
    academic_year= Column(String(10), nullable=False)
    day_of_week  = Column(String(10), nullable=False)  # Monday … Saturday
    period_no    = Column(Integer, nullable=False)      # 1-8
    subject      = Column(String(100), nullable=False)
    teacher_name = Column(String(100))
    start_time   = Column(String(8))   # HH:MM
    end_time     = Column(String(8))
    room_no      = Column(String(20))
    is_active    = Column(Boolean, default=True)
