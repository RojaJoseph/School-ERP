from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean, Date, Float, Enum
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class BookStatusEnum(str, enum.Enum):
    available   = "available"
    issued      = "issued"
    reserved    = "reserved"
    lost        = "lost"
    damaged     = "damaged"

class Book(Base):
    __tablename__ = "books"

    id             = Column(Integer, primary_key=True, index=True)
    title          = Column(String(255), nullable=False, index=True)
    author         = Column(String(200), nullable=True)
    isbn           = Column(String(50), unique=True, nullable=True)
    publisher      = Column(String(200), nullable=True)
    category       = Column(String(100), nullable=True)
    edition        = Column(String(50), nullable=True)
    quantity       = Column(Integer, default=1)
    available_qty  = Column(Integer, default=1)
    price          = Column(Float, default=0)
    shelf_location = Column(String(100), nullable=True)
    cover_image    = Column(String(255), nullable=True)
    description    = Column(Text, nullable=True)
    is_active      = Column(Boolean, default=True)
    created_at     = Column(DateTime(timezone=True), server_default=func.now())

class BookIssue(Base):
    __tablename__ = "book_issues"

    id            = Column(Integer, primary_key=True, index=True)
    book_id       = Column(Integer, ForeignKey("books.id"), nullable=False, index=True)
    student_id    = Column(Integer, ForeignKey("students.id"), nullable=True)
    employee_id   = Column(Integer, ForeignKey("employees.id"), nullable=True)
    issued_date   = Column(Date, nullable=False)
    due_date      = Column(Date, nullable=False)
    return_date   = Column(Date, nullable=True)
    fine_amount   = Column(Float, default=0)
    fine_paid     = Column(Boolean, default=False)
    status        = Column(Enum(BookStatusEnum), default=BookStatusEnum.issued)
    issued_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
