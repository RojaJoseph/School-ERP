from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.base import get_db
from app.schemas.library import BookCreate, BookIssueCreate, BookReturnUpdate
from app.crud.crud_library import (
    create_book, get_books, get_book,
    issue_book, return_book, get_issued_books
)
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/library", tags=["Library"])

@router.post("/books", status_code=201)
def add_book(data: BookCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.librarian, RoleEnum.school_admin))):
    return create_book(db, data)

@router.get("/books")
def list_books(search: Optional[str] = None, category: Optional[str] = None, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    total, books = get_books(db, search, category, skip, per_page)
    return {"total": total, "page": page, "per_page": per_page, "books": books}

@router.get("/books/{book_id}")
def get_single_book(book_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    book = get_book(db, book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book

@router.post("/issues", status_code=201)
def issue_new_book(data: BookIssueCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.librarian, RoleEnum.school_admin))):
    obj = issue_book(db, data, current_user.id)
    if not obj:
        raise HTTPException(status_code=400, detail="Book not available or not found")
    return obj

@router.patch("/issues/{issue_id}/return")
def return_issued_book(issue_id: int, data: BookReturnUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.librarian, RoleEnum.school_admin))):
    obj = return_book(db, issue_id, data)
    if not obj:
        raise HTTPException(status_code=404, detail="Issue record not found")
    return obj

@router.get("/issues")
def list_issued(student_id: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_issued_books(db, student_id)
