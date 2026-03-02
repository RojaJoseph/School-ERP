from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import date, datetime
from typing import Optional, List
from app.db.base import get_db
from app.schemas.attendance import BulkAttendanceCreate as AttendanceBulkCreate, AttendanceResponse
from app.crud.crud_attendance import bulk_create_attendance, get_attendance, get_class_attendance, get_attendance_summary
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/attendance", tags=["Attendance"])


@router.post("/bulk", response_model=List[AttendanceResponse])
def mark_bulk(
    data: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return bulk_create_attendance(db, data, current_user.id)


@router.get("/class")
def class_attendance(
    class_name: str,
    date: date,
    section: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    records = get_class_attendance(db, class_name, section, date)
    return {"date": date, "class_name": class_name, "section": section, "records": records}


@router.get("/student/{student_id}")
def student_attendance(
    student_id: int,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date]   = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Default: current academic year (April 1 → today)
    today = date.today()
    if from_date is None:
        year  = today.year if today.month >= 4 else today.year - 1
        from_date = date(year, 4, 1)
    if to_date is None:
        to_date = today

    records = get_attendance(db, student_id, from_date, to_date)
    return {"student_id": student_id, "records": records}


@router.get("/student/{student_id}/summary")
def attendance_summary(
    student_id: int,
    from_date: Optional[date] = Query(None),
    to_date: Optional[date]   = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Attendance summary for a student. Defaults to current academic year if dates not provided."""
    today = date.today()
    if from_date is None:
        year      = today.year if today.month >= 4 else today.year - 1
        from_date = date(year, 4, 1)
    if to_date is None:
        to_date = today

    return get_attendance_summary(db, student_id, from_date, to_date)
