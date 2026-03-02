from sqlalchemy import Column, String, Integer, Date, DateTime, Float, Text, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class ExamTypeEnum(str, enum.Enum):
    unit_test    = "unit_test"
    midterm      = "midterm"
    final        = "final"
    quarterly    = "quarterly"
    half_yearly  = "half_yearly"
    annual       = "annual"

class Exam(Base):
    __tablename__ = "exams"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(200), nullable=False)
    exam_type     = Column(Enum(ExamTypeEnum), nullable=False)
    class_name    = Column(String(50), nullable=False)
    section       = Column(String(10), nullable=True)
    subject       = Column(String(100), nullable=False)
    exam_date     = Column(Date, nullable=False)
    start_time    = Column(String(20), nullable=True)
    end_time      = Column(String(20), nullable=True)
    total_marks   = Column(Float, nullable=False)
    passing_marks = Column(Float, nullable=False)
    academic_year = Column(String(20), nullable=False)
    created_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

class ExamResult(Base):
    __tablename__ = "exam_results"

    id          = Column(Integer, primary_key=True, index=True)
    exam_id     = Column(Integer, ForeignKey("exams.id"), nullable=False, index=True)
    student_id  = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    marks       = Column(Float, nullable=True)
    grade       = Column(String(5), nullable=True)
    remarks     = Column(Text, nullable=True)
    is_absent   = Column(Boolean, default=False)
    entered_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class Assignment(Base):
    __tablename__ = "assignments"

    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String(255), nullable=False)
    description   = Column(Text, nullable=True)
    class_name    = Column(String(50), nullable=False)
    section       = Column(String(10), nullable=True)
    subject       = Column(String(100), nullable=False)
    due_date      = Column(Date, nullable=False)
    file_path     = Column(String(255), nullable=True)
    created_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id            = Column(Integer, primary_key=True, index=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False, index=True)
    student_id    = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    file_path     = Column(String(255), nullable=True)
    remarks       = Column(Text, nullable=True)
    grade         = Column(String(10), nullable=True)
    score         = Column(Float, nullable=True)
    feedback      = Column(Text, nullable=True)
    submitted_at  = Column(DateTime(timezone=True), server_default=func.now())
    graded_at     = Column(DateTime(timezone=True), nullable=True)
    graded_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
