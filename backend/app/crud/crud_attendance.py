from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.attendance import Attendance
from app.schemas.attendance import BulkAttendanceCreate as AttendanceBulkCreate, AttendanceUpdate
from datetime import date
from typing import Optional, List

def bulk_create_attendance(db: Session, data: AttendanceBulkCreate, marked_by: int) -> List[Attendance]:
    records = []
    for entry in data.records:
        # Avoid duplicate for same student+date
        existing = db.query(Attendance).filter(
            Attendance.student_id == entry.student_id,
            Attendance.date == data.date
        ).first()
        if existing:
            existing.status = entry.status
            existing.remarks = entry.remarks
            records.append(existing)
        else:
            obj = Attendance(
                student_id = entry.student_id,
                class_name = data.class_name,
                section    = data.section,
                date       = data.date,
                status     = entry.status,
                remarks    = entry.remarks,
                marked_by  = marked_by
            )
            db.add(obj)
            records.append(obj)
    db.commit()
    return records

def get_attendance(db: Session, student_id: int, from_date: date, to_date: date):
    return db.query(Attendance).filter(
        Attendance.student_id == student_id,
        Attendance.date >= from_date,
        Attendance.date <= to_date
    ).all()

def get_class_attendance(db: Session, class_name: str, section: Optional[str], date: date):
    q = db.query(Attendance).filter(
        Attendance.class_name == class_name,
        Attendance.date == date
    )
    if section:
        q = q.filter(Attendance.section == section)
    return q.all()

def get_attendance_summary(db: Session, student_id: int, from_date: date, to_date: date):
    records = get_attendance(db, student_id, from_date, to_date)
    summary = {"total": len(records), "present": 0, "absent": 0, "late": 0, "leave": 0}
    for r in records:
        if r.status in summary:
            summary[r.status] += 1
    return summary
