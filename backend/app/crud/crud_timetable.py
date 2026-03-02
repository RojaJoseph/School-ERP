from sqlalchemy.orm import Session
from typing import Optional, List
from app.models.timetable import TimetableEntry
from app.schemas.timetable import TimetableEntryCreate, TimetableEntryUpdate

def create_entry(db: Session, data: TimetableEntryCreate) -> TimetableEntry:
    obj = TimetableEntry(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_timetable(db: Session, class_name: str, section: str = "A", academic_year: str = "") -> List[TimetableEntry]:
    q = db.query(TimetableEntry).filter(
        TimetableEntry.class_name == class_name,
        TimetableEntry.section    == section,
        TimetableEntry.is_active  == True,
    )
    if academic_year:
        q = q.filter(TimetableEntry.academic_year == academic_year)
    return q.order_by(TimetableEntry.day_of_week, TimetableEntry.period_no).all()

def get_teacher_schedule(db: Session, teacher_name: str, academic_year: str = "") -> List[TimetableEntry]:
    q = db.query(TimetableEntry).filter(
        TimetableEntry.teacher_name.ilike(f"%{teacher_name}%"),
        TimetableEntry.is_active == True,
    )
    if academic_year:
        q = q.filter(TimetableEntry.academic_year == academic_year)
    return q.all()

def update_entry(db: Session, entry_id: int, data: TimetableEntryUpdate) -> Optional[TimetableEntry]:
    obj = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

def delete_entry(db: Session, entry_id: int) -> bool:
    obj = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not obj:
        return False
    obj.is_active = False
    db.commit()
    return True

def bulk_upsert(db: Session, entries: List[TimetableEntryCreate]) -> List[TimetableEntry]:
    """Replace all timetable entries for a class/section/year with new data."""
    if not entries:
        return []
    first = entries[0]
    # Deactivate existing
    db.query(TimetableEntry).filter(
        TimetableEntry.class_name    == first.class_name,
        TimetableEntry.section       == first.section,
        TimetableEntry.academic_year == first.academic_year,
    ).update({"is_active": False})
    db.commit()
    # Insert new
    objs = [TimetableEntry(**e.model_dump()) for e in entries]
    db.add_all(objs)
    db.commit()
    for o in objs:
        db.refresh(o)
    return objs
