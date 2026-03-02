from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional, List
from datetime import date
from app.models.portal import (
    Announcement, Homework, StudentRemark,
    StudentLeave, Gallery, CalendarEvent, Project
)
from app.models.student import Student
from app.schemas.portal import (
    AnnouncementCreate, HomeworkCreate, RemarkCreate,
    StudentLeaveCreate, GalleryCreate, CalendarEventCreate, ProjectCreate
)

# ── Student Portal Login ──────────────────────────────
def portal_login(db: Session, name: str, phone: str) -> Optional[Student]:
    """Find student by name (case-insensitive) and guardian phone or student phone."""
    name = name.strip().lower()
    students = db.query(Student).filter(Student.is_active == True).all()
    for s in students:
        full_name = f"{s.first_name} {s.last_name}".lower()
        if full_name == name:
            if s.phone == phone or s.guardian_phone == phone:
                return s
    return None

# ── Announcements ─────────────────────────────────────
def create_announcement(db: Session, data: AnnouncementCreate, user_id: int):
    obj = Announcement(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_announcements(db: Session, class_name: Optional[str] = None):
    q = db.query(Announcement)
    if class_name:
        q = q.filter(or_(
            Announcement.target == "all",
            Announcement.class_name == class_name
        ))
    return q.order_by(Announcement.created_at.desc()).limit(50).all()

# ── Homework ──────────────────────────────────────────
def create_homework(db: Session, data: HomeworkCreate, user_id: int):
    obj = Homework(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_homework(db: Session, class_name: str, section: Optional[str] = None):
    q = db.query(Homework).filter(Homework.class_name == class_name)
    if section:
        q = q.filter(or_(Homework.section == section, Homework.section == None))
    return q.order_by(Homework.due_date.desc()).all()

# ── Remarks ───────────────────────────────────────────
def create_remark(db: Session, data: RemarkCreate, user_id: int):
    obj = StudentRemark(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_remarks(db: Session, student_id: int):
    return db.query(StudentRemark).filter(
        StudentRemark.student_id == student_id
    ).order_by(StudentRemark.created_at.desc()).all()

# ── Student Leave ─────────────────────────────────────
def create_student_leave(db: Session, data: StudentLeaveCreate):
    obj = StudentLeave(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_student_leaves(db: Session, student_id: int):
    return db.query(StudentLeave).filter(
        StudentLeave.student_id == student_id
    ).order_by(StudentLeave.created_at.desc()).all()

def get_all_leaves(db: Session, status: Optional[str] = None, class_name: Optional[str] = None):
    q = db.query(StudentLeave)
    if status:
        q = q.filter(StudentLeave.status == status)
    return q.order_by(StudentLeave.created_at.desc()).all()

def review_leave(db: Session, leave_id: int, status: str, note: str, user_id: int):
    obj = db.query(StudentLeave).filter(StudentLeave.id == leave_id).first()
    if obj:
        obj.status = status
        obj.review_note = note
        obj.reviewed_by = user_id
        db.commit()
        db.refresh(obj)
    return obj

# ── Gallery ───────────────────────────────────────────
def create_gallery(db: Session, data: GalleryCreate, user_id: int):
    obj = Gallery(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_gallery(db: Session, class_name: Optional[str] = None):
    q = db.query(Gallery)
    if class_name:
        q = q.filter(or_(Gallery.class_name == class_name, Gallery.class_name == None))
    return q.order_by(Gallery.created_at.desc()).all()

# ── Calendar Events ───────────────────────────────────
def create_event(db: Session, data: CalendarEventCreate, user_id: int):
    obj = CalendarEvent(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_events(db: Session, class_name: Optional[str] = None, month: Optional[int] = None, year: Optional[int] = None):
    q = db.query(CalendarEvent)
    if class_name:
        q = q.filter(or_(CalendarEvent.class_name == class_name, CalendarEvent.class_name == None))
    if month:
        q = q.filter(CalendarEvent.event_date.between(
            date(year or date.today().year, month, 1),
            date(year or date.today().year, month, 28)
        ))
    return q.order_by(CalendarEvent.event_date).all()

# ── Projects ──────────────────────────────────────────
def create_project(db: Session, data: ProjectCreate, user_id: int):
    obj = Project(**data.model_dump(), created_by=user_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_projects(db: Session, class_name: str, section: Optional[str] = None):
    q = db.query(Project).filter(Project.class_name == class_name)
    if section:
        q = q.filter(or_(Project.section == section, Project.section == None))
    return q.order_by(Project.due_date.desc()).all()
