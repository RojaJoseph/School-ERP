from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.db.base import get_db
from app.schemas.timetable import TimetableEntryCreate, TimetableEntryUpdate, TimetableEntryResponse
from app.crud.crud_timetable import create_entry, get_timetable, get_teacher_schedule, update_entry, delete_entry, bulk_upsert
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/timetable", tags=["Timetable"])

@router.get("/", response_model=List[TimetableEntryResponse])
def get_class_timetable(
    class_name:    str          = Query(...),
    section:       str          = Query("A"),
    academic_year: Optional[str]= Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_timetable(db, class_name, section, academic_year or "")

@router.get("/teacher", response_model=List[TimetableEntryResponse])
def get_teacher_timetable(
    teacher_name:  str           = Query(...),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return get_teacher_schedule(db, teacher_name, academic_year or "")

@router.post("/", response_model=TimetableEntryResponse, status_code=201)
def add_entry(
    data: TimetableEntryCreate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return create_entry(db, data)

@router.post("/bulk", response_model=List[TimetableEntryResponse])
def bulk_create(
    entries: List[TimetableEntryCreate],
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not entries:
        raise HTTPException(400, "No entries provided")
    return bulk_upsert(db, entries)

@router.put("/{entry_id}", response_model=TimetableEntryResponse)
def update(
    entry_id: int,
    data: TimetableEntryUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    obj = update_entry(db, entry_id, data)
    if not obj:
        raise HTTPException(404, "Entry not found")
    return obj

@router.delete("/{entry_id}", status_code=204)
def delete(
    entry_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    if not delete_entry(db, entry_id):
        raise HTTPException(404, "Entry not found")
