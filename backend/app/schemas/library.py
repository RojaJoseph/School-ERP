from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

class BookStatusEnum(str, Enum):
    available = "available"
    issued    = "issued"
    reserved  = "reserved"
    lost      = "lost"
    damaged   = "damaged"

class BookCreate(BaseModel):
    title:          str
    author:         Optional[str] = None
    isbn:           Optional[str] = None
    publisher:      Optional[str] = None
    category:       Optional[str] = None
    edition:        Optional[str] = None
    quantity:       int = 1
    price:          float = 0
    shelf_location: Optional[str] = None
    description:    Optional[str] = None

class BookResponse(BookCreate):
    id:            int
    available_qty: int
    is_active:     bool
    created_at:    datetime
    class Config:
        from_attributes = True

class BookIssueCreate(BaseModel):
    book_id:     int
    student_id:  Optional[int] = None
    employee_id: Optional[int] = None
    issued_date: date
    due_date:    date

class BookReturnUpdate(BaseModel):
    return_date: date
    fine_amount: float = 0
    fine_paid:   bool = False

class BookIssueResponse(BookIssueCreate):
    id:          int
    return_date: Optional[date]
    fine_amount: float
    status:      BookStatusEnum
    created_at:  datetime
    class Config:
        from_attributes = True
