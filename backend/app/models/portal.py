from sqlalchemy import Column, String, Integer, Date, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class HomeworkStatusEnum(str, enum.Enum):
    pending   = "pending"
    submitted = "submitted"
    graded    = "graded"

class LeaveStatusEnum(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"

class Homework(Base):
    __tablename__ = "homework"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject     = Column(String(100), nullable=False)
    class_name  = Column(String(50), nullable=False)
    section     = Column(String(10), nullable=True)
    due_date    = Column(Date, nullable=False)
    file_path   = Column(String(255), nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class Announcement(Base):
    __tablename__ = "announcements"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    content     = Column(Text, nullable=False)
    target      = Column(String(50), default="all")  # all, class, teacher, student
    class_name  = Column(String(50), nullable=True)
    is_active   = Column(Boolean, default=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class StudentRemark(Base):
    __tablename__ = "student_remarks"
    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    remark      = Column(Text, nullable=False)
    remark_type = Column(String(50), default="general")  # general, behaviour, academic, attendance
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class GalleryItem(Base):
    __tablename__ = "gallery"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    image_path  = Column(String(255), nullable=False)
    category    = Column(String(100), nullable=True)  # sports, academics, events
    class_name  = Column(String(50), nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class Project(Base):
    __tablename__ = "projects"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    subject     = Column(String(100), nullable=False)
    class_name  = Column(String(50), nullable=False)
    section     = Column(String(10), nullable=True)
    due_date    = Column(Date, nullable=False)
    guidelines  = Column(Text, nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class CalendarEvent(Base):
    __tablename__ = "calendar_events"
    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_date  = Column(Date, nullable=False)
    end_date    = Column(Date, nullable=True)
    event_type  = Column(String(50), default="event")  # holiday, exam, event, meeting
    class_name  = Column(String(50), nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class StudentLeaveRequest(Base):
    __tablename__ = "student_leave_requests"
    id          = Column(Integer, primary_key=True, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    from_date   = Column(Date, nullable=False)
    to_date     = Column(Date, nullable=False)
    reason      = Column(Text, nullable=False)
    status      = Column(Enum(LeaveStatusEnum), default=LeaveStatusEnum.pending)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    remarks     = Column(Text, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
