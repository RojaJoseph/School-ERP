from sqlalchemy.orm import Session
from datetime import date as Date
from app.models.library import Book, BookIssue
from app.schemas.library import BookCreate, BookIssueCreate, BookReturnUpdate
from typing import Optional

def create_book(db: Session, data: BookCreate) -> Book:
    obj = Book(**data.model_dump(), available_qty=data.quantity)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_books(db: Session, search: Optional[str] = None, category: Optional[str] = None, skip=0, limit=20):
    q = db.query(Book).filter(Book.is_active == True)
    if search:
        q = q.filter(Book.title.ilike(f"%{search}%"))
    if category:
        q = q.filter(Book.category == category)
    total = q.count()
    return total, q.offset(skip).limit(limit).all()

def get_book(db: Session, book_id: int) -> Optional[Book]:
    return db.query(Book).filter(Book.id == book_id).first()

def issue_book(db: Session, data: BookIssueCreate, issued_by: int) -> Optional[BookIssue]:
    book = get_book(db, data.book_id)
    if not book or book.available_qty < 1:
        return None
    book.available_qty -= 1
    obj = BookIssue(**data.model_dump(), issued_by=issued_by)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def return_book(db: Session, issue_id: int, data: BookReturnUpdate) -> Optional[BookIssue]:
    obj = db.query(BookIssue).filter(BookIssue.id == issue_id).first()
    if not obj:
        return None
    obj.return_date = data.return_date
    obj.fine_amount = data.fine_amount
    obj.fine_paid = data.fine_paid
    obj.status = "available"
    book = get_book(db, obj.book_id)
    if book:
        book.available_qty += 1
    db.commit()
    db.refresh(obj)
    return obj

def get_issued_books(db: Session, student_id: Optional[int] = None):
    q = db.query(BookIssue).filter(BookIssue.return_date == None)
    if student_id:
        q = q.filter(BookIssue.student_id == student_id)
    return q.all()
