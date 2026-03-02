from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, datetime
from app.db.base import get_db
from app.models.student import Student
from app.models.portal import (
    Homework, Announcement, StudentRemark, GalleryItem,
    Project, CalendarEvent, StudentLeaveRequest
)
from app.models.exam import Exam, ExamResult, Assignment
from app.models.timetable import TimetableEntry
from app.models.transport import StudentTransport, BusRoute
from app.models.attendance import Attendance
from pydantic import BaseModel
import os, uuid, shutil

router = APIRouter(prefix="/portal", tags=["Student Portal"])

# ── Student Login ────────────────────────────────────
class PortalLogin(BaseModel):
    name:  str
    phone: str

@router.post("/login")
def portal_login(data: PortalLogin, db: Session = Depends(get_db)):
    """Login with name + phone number."""
    student = db.query(Student).filter(
        Student.guardian_phone == data.phone,
        Student.is_active == True
    ).first()
    # Also try student's own phone
    if not student:
        student = db.query(Student).filter(
            Student.phone == data.phone,
            Student.is_active == True
        ).first()
    if not student:
        raise HTTPException(404, "Student not found. Check name and phone number.")
    # Loose name match
    full_name = f"{student.first_name} {student.last_name}".lower()
    if data.name.lower() not in full_name and full_name not in data.name.lower():
        raise HTTPException(401, "Name does not match our records.")
    return {
        "student": {
            "id":           student.id,
            "name":         f"{student.first_name} {student.last_name}",
            "admission_no": student.admission_no,
            "class_name":   student.class_name,
            "section":      student.section,
            "academic_year":student.academic_year,
            "photo":        student.photo,
            "roll_no":      student.roll_no,
            "guardian_name":student.guardian_name,
            "guardian_phone":student.guardian_phone,
            "date_of_birth":str(student.date_of_birth),
            "gender":       student.gender,
            "blood_group":  student.blood_group,
            "address":      student.address,
        }
    }

# ── Child Info ───────────────────────────────────────
@router.get("/student/{student_id}")
def get_student_info(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    # Attendance summary
    from sqlalchemy import func
    total = db.query(Attendance).filter(Attendance.student_id == student_id).count()
    present = db.query(Attendance).filter(
        Attendance.student_id == student_id, Attendance.status == "present"
    ).count()
    att_pct = round((present / total * 100) if total > 0 else 0, 1)
    return {
        "id": s.id, "admission_no": s.admission_no, "roll_no": s.roll_no,
        "name": f"{s.first_name} {s.last_name}",
        "class_name": s.class_name, "section": s.section,
        "academic_year": s.academic_year, "photo": s.photo,
        "date_of_birth": str(s.date_of_birth), "gender": s.gender,
        "blood_group": s.blood_group, "email": s.email, "phone": s.phone,
        "address": s.address, "city": s.city, "state": s.state,
        "guardian_name": s.guardian_name, "guardian_phone": s.guardian_phone,
        "guardian_email": s.guardian_email, "guardian_relation": s.guardian_relation,
        "attendance_percentage": att_pct, "total_attendance": total,
    }

# ── Homework ─────────────────────────────────────────
@router.get("/homework/{student_id}")
def get_homework(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    hw = db.query(Homework).filter(
        Homework.class_name == s.class_name,
        Homework.is_active if hasattr(Homework, 'is_active') else True
    ).order_by(Homework.due_date.desc()).limit(20).all()
    return [{"id": h.id, "title": h.title, "description": h.description,
             "subject": h.subject, "due_date": str(h.due_date),
             "created_at": str(h.created_at)} for h in hw]

# ── Class Timetable ──────────────────────────────────
@router.get("/timetable/{student_id}")
def get_timetable(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    entries = db.query(TimetableEntry).filter(
        TimetableEntry.class_name == s.class_name,
        TimetableEntry.section == s.section,
        TimetableEntry.academic_year == s.academic_year,
        TimetableEntry.is_active == True,
    ).order_by(TimetableEntry.day_of_week, TimetableEntry.period_no).all()
    return [{"id": e.id, "day": e.day_of_week, "period": e.period_no,
             "subject": e.subject, "teacher": e.teacher_name,
             "start_time": e.start_time, "end_time": e.end_time,
             "room": e.room_no} for e in entries]

# ── Exam Timetable ───────────────────────────────────
@router.get("/exam-timetable/{student_id}")
def get_exam_timetable(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    exams = db.query(Exam).filter(
        Exam.class_name == s.class_name,
        Exam.academic_year == s.academic_year,
        Exam.exam_date >= date.today()
    ).order_by(Exam.exam_date).all()
    return [{"id": e.id, "name": e.name, "subject": e.subject,
             "exam_date": str(e.exam_date), "start_time": e.start_time,
             "end_time": e.end_time, "total_marks": e.total_marks,
             "exam_type": e.exam_type} for e in exams]

# ── Results ──────────────────────────────────────────
@router.get("/results/{student_id}")
def get_results(student_id: int, db: Session = Depends(get_db)):
    results = db.query(ExamResult).filter(
        ExamResult.student_id == student_id
    ).all()
    out = []
    for r in results:
        exam = db.query(Exam).filter(Exam.id == r.exam_id).first()
        out.append({
            "id": r.id, "exam_id": r.exam_id,
            "exam_name": exam.name if exam else "—",
            "subject": exam.subject if exam else "—",
            "exam_type": exam.exam_type if exam else "—",
            "exam_date": str(exam.exam_date) if exam else "—",
            "marks": r.marks, "grade": r.grade,
            "total_marks": exam.total_marks if exam else 0,
            "is_absent": r.is_absent, "remarks": r.remarks,
        })
    return sorted(out, key=lambda x: x["exam_date"], reverse=True)

# ── Calendar ─────────────────────────────────────────
@router.get("/calendar/{student_id}")
def get_calendar(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    events = db.query(CalendarEvent).filter(
        (CalendarEvent.class_name == None) |
        (CalendarEvent.class_name == (s.class_name if s else ""))
    ).order_by(CalendarEvent.event_date).all()
    return [{"id": e.id, "title": e.title, "description": e.description,
             "event_date": str(e.event_date),
             "end_date": str(e.end_date) if e.end_date else None,
             "event_type": e.event_type} for e in events]

# ── Leave Requests ───────────────────────────────────
@router.get("/leaves/{student_id}")
def get_leaves(student_id: int, db: Session = Depends(get_db)):
    leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.student_id == student_id
    ).order_by(StudentLeaveRequest.created_at.desc()).all()
    return [{"id": l.id, "from_date": str(l.from_date), "to_date": str(l.to_date),
             "reason": l.reason, "status": l.status, "remarks": l.remarks,
             "created_at": str(l.created_at)} for l in leaves]

class LeaveCreate(BaseModel):
    from_date: date
    to_date:   date
    reason:    str

@router.post("/leaves/{student_id}")
def apply_leave(student_id: int, data: LeaveCreate, db: Session = Depends(get_db)):
    leave = StudentLeaveRequest(
        student_id=student_id,
        from_date=data.from_date,
        to_date=data.to_date,
        reason=data.reason,
    )
    db.add(leave)
    db.commit()
    db.refresh(leave)
    return {"message": "Leave request submitted!", "id": leave.id}

@router.patch("/leaves/{leave_id}/review")
def review_leave(leave_id: int, status: str, remarks: Optional[str] = None,
                 db: Session = Depends(get_db)):
    leave = db.query(StudentLeaveRequest).filter(StudentLeaveRequest.id == leave_id).first()
    if not leave:
        raise HTTPException(404, "Leave not found")
    leave.status = status
    leave.remarks = remarks
    leave.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": f"Leave {status}"}

# ── Van Info ─────────────────────────────────────────
@router.get("/van/{student_id}")
def get_van_info(student_id: int, db: Session = Depends(get_db)):
    transport = db.query(StudentTransport).filter(
        StudentTransport.student_id == student_id,
        StudentTransport.is_active == True
    ).first()
    if not transport:
        return {"assigned": False}
    route = db.query(BusRoute).filter(BusRoute.id == transport.route_id).first()
    return {
        "assigned": True,
        "stop_name": transport.stop_name,
        "pickup_time": transport.pickup_time,
        "drop_time": transport.drop_time,
        "route_name": route.route_name if route else "—",
        "route_no": route.route_no if route else "—",
        "driver_name": route.driver_name if route else "—",
        "driver_phone": route.driver_phone if route else "—",
        "vehicle_no": route.vehicle_no if route else "—",
    }

# ── Announcements ────────────────────────────────────
@router.get("/announcements/{student_id}")
def get_announcements(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    announcements = db.query(Announcement).filter(
        Announcement.is_active == True,
        (Announcement.target == "all") |
        (Announcement.target == "student") |
        (Announcement.class_name == (s.class_name if s else ""))
    ).order_by(Announcement.created_at.desc()).limit(20).all()
    return [{"id": a.id, "title": a.title, "content": a.content,
             "target": a.target, "created_at": str(a.created_at)} for a in announcements]

# ── Student Remarks ──────────────────────────────────
@router.get("/remarks/{student_id}")
def get_remarks(student_id: int, db: Session = Depends(get_db)):
    remarks = db.query(StudentRemark).filter(
        StudentRemark.student_id == student_id
    ).order_by(StudentRemark.created_at.desc()).all()
    return [{"id": r.id, "remark": r.remark, "remark_type": r.remark_type,
             "created_at": str(r.created_at)} for r in remarks]

# ── Gallery ──────────────────────────────────────────
@router.get("/gallery/{student_id}")
def get_gallery(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    items = db.query(GalleryItem).filter(
        (GalleryItem.class_name == None) |
        (GalleryItem.class_name == (s.class_name if s else ""))
    ).order_by(GalleryItem.created_at.desc()).all()
    return [{"id": g.id, "title": g.title, "description": g.description,
             "image_path": g.image_path, "category": g.category,
             "created_at": str(g.created_at)} for g in items]

# ── Projects ─────────────────────────────────────────
@router.get("/projects/{student_id}")
def get_projects(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    projects = db.query(Project).filter(
        Project.class_name == s.class_name
    ).order_by(Project.due_date).all()
    return [{"id": p.id, "title": p.title, "description": p.description,
             "subject": p.subject, "due_date": str(p.due_date),
             "guidelines": p.guidelines, "created_at": str(p.created_at)} for p in projects]

# ── Assignments ──────────────────────────────────────
@router.get("/assignments/{student_id}")
def get_assignments(student_id: int, db: Session = Depends(get_db)):
    s = db.query(Student).filter(Student.id == student_id).first()
    if not s:
        raise HTTPException(404, "Student not found")
    assignments = db.query(Assignment).filter(
        Assignment.class_name == s.class_name
    ).order_by(Assignment.due_date).all()
    from app.models.exam import AssignmentSubmission
    result = []
    for a in assignments:
        sub = db.query(AssignmentSubmission).filter(
            AssignmentSubmission.assignment_id == a.id,
            AssignmentSubmission.student_id == student_id
        ).first()
        result.append({
            "id": a.id, "title": a.title, "description": a.description,
            "subject": a.subject, "due_date": str(a.due_date),
            "submitted": sub is not None,
            "grade": sub.grade if sub else None,
            "score": sub.score if sub else None,
            "feedback": sub.feedback if sub else None,
            "submitted_at": str(sub.submitted_at) if sub else None,
        })
    return result

# ── Attendance Summary ───────────────────────────────
@router.get("/attendance/{student_id}")
def get_attendance(student_id: int, db: Session = Depends(get_db)):
    records = db.query(Attendance).filter(
        Attendance.student_id == student_id
    ).order_by(Attendance.date.desc()).limit(30).all()
    total   = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent  = sum(1 for r in records if r.status == "absent")
    late    = sum(1 for r in records if r.status == "late")
    return {
        "total": total, "present": present, "absent": absent, "late": late,
        "percentage": round((present / total * 100) if total > 0 else 0, 1),
        "records": [{"date": str(r.date), "status": r.status, "remarks": r.remarks}
                    for r in records]
    }

# ── Teacher: Post Homework ───────────────────────────
class HomeworkCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    subject:     str
    class_name:  str
    section:     Optional[str] = None
    due_date:    date

@router.post("/homework")
def post_homework(data: HomeworkCreate, db: Session = Depends(get_db)):
    hw = Homework(**data.model_dump())
    db.add(hw)
    db.commit()
    db.refresh(hw)
    return hw

# ── Teacher: Post Announcement ───────────────────────
class AnnouncementCreate(BaseModel):
    title:      str
    content:    str
    target:     str = "all"
    class_name: Optional[str] = None

@router.post("/announcements")
def post_announcement(data: AnnouncementCreate, db: Session = Depends(get_db)):
    ann = Announcement(**data.model_dump())
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return ann

# ── Teacher: Post Remark ─────────────────────────────
class RemarkCreate(BaseModel):
    student_id:  int
    remark:      str
    remark_type: str = "general"

@router.post("/remarks")
def post_remark(data: RemarkCreate, db: Session = Depends(get_db)):
    r = StudentRemark(**data.model_dump())
    db.add(r)
    db.commit()
    db.refresh(r)
    return r

# ── Teacher: Post Calendar Event ─────────────────────
class EventCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    event_date:  date
    end_date:    Optional[date] = None
    event_type:  str = "event"
    class_name:  Optional[str] = None

@router.post("/calendar")
def post_event(data: EventCreate, db: Session = Depends(get_db)):
    e = CalendarEvent(**data.model_dump())
    db.add(e)
    db.commit()
    db.refresh(e)
    return e

# ── Teacher: Post Project ────────────────────────────
class ProjectCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    subject:     str
    class_name:  str
    section:     Optional[str] = None
    due_date:    date
    guidelines:  Optional[str] = None

@router.post("/projects")
def post_project(data: ProjectCreate, db: Session = Depends(get_db)):
    p = Project(**data.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p

# ── Get all leave requests (for teacher/admin) ────────
@router.get("/leaves/all/{class_name}")
def get_all_leaves(class_name: str, db: Session = Depends(get_db)):
    students = db.query(Student).filter(Student.class_name == class_name).all()
    student_ids = [s.id for s in students]
    student_map = {s.id: f"{s.first_name} {s.last_name}" for s in students}
    leaves = db.query(StudentLeaveRequest).filter(
        StudentLeaveRequest.student_id.in_(student_ids)
    ).order_by(StudentLeaveRequest.created_at.desc()).all()
    return [{
        "id": l.id,
        "student_name": student_map.get(l.student_id, "Unknown"),
        "student_id": l.student_id,
        "from_date": str(l.from_date), "to_date": str(l.to_date),
        "reason": l.reason, "status": l.status, "remarks": l.remarks,
        "created_at": str(l.created_at)
    } for l in leaves]
