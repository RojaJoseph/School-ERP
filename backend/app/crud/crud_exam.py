from sqlalchemy.orm import Session
from datetime import datetime
from app.models.exam import Exam, ExamResult, Assignment, AssignmentSubmission
from app.schemas.exam import ExamCreate, ExamUpdate, BulkResultCreate, AssignmentCreate, SubmissionGrade
from typing import Optional

# ─── Exams ──────────────────────────────────────────
def create_exam(db: Session, data: ExamCreate, created_by: int) -> Exam:
    obj = Exam(**data.model_dump(), created_by=created_by)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_exams(db: Session, class_name: Optional[str] = None, academic_year: Optional[str] = None):
    q = db.query(Exam)
    if class_name:
        q = q.filter(Exam.class_name == class_name)
    if academic_year:
        q = q.filter(Exam.academic_year == academic_year)
    return q.all()

def get_exam(db: Session, exam_id: int) -> Optional[Exam]:
    return db.query(Exam).filter(Exam.id == exam_id).first()

# ─── Marks Entry ────────────────────────────────────
def _calc_grade(marks: float, total: float) -> str:
    pct = (marks / total) * 100
    if pct >= 90: return "A+"
    if pct >= 80: return "A"
    if pct >= 70: return "B+"
    if pct >= 60: return "B"
    if pct >= 50: return "C"
    if pct >= 35: return "D"
    return "F"

def bulk_save_results(db: Session, data: BulkResultCreate, entered_by: int):
    exam = get_exam(db, data.exam_id)
    if not exam:
        return []
    results = []
    for entry in data.results:
        existing = db.query(ExamResult).filter(
            ExamResult.exam_id == data.exam_id,
            ExamResult.student_id == entry.student_id
        ).first()
        grade = None if entry.is_absent else _calc_grade(entry.marks or 0, exam.total_marks)
        if existing:
            existing.marks = entry.marks
            existing.is_absent = entry.is_absent
            existing.grade = grade
            existing.remarks = entry.remarks
            results.append(existing)
        else:
            obj = ExamResult(
                exam_id=data.exam_id, student_id=entry.student_id,
                marks=entry.marks, is_absent=entry.is_absent,
                grade=grade, remarks=entry.remarks, entered_by=entered_by
            )
            db.add(obj)
            results.append(obj)
    db.commit()
    return results

def get_results_by_exam(db: Session, exam_id: int):
    return db.query(ExamResult).filter(ExamResult.exam_id == exam_id).all()

def get_results_by_student(db: Session, student_id: int, academic_year: Optional[str] = None):
    q = db.query(ExamResult).join(Exam).filter(ExamResult.student_id == student_id)
    if academic_year:
        q = q.filter(Exam.academic_year == academic_year)
    return q.all()

# ─── Assignments ────────────────────────────────────
def create_assignment(db: Session, data: AssignmentCreate, created_by: int, file_path: Optional[str] = None) -> Assignment:
    obj = Assignment(**data.model_dump(), created_by=created_by, file_path=file_path)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_assignments(db: Session, class_name: Optional[str] = None, subject: Optional[str] = None):
    q = db.query(Assignment)
    if class_name:
        q = q.filter(Assignment.class_name == class_name)
    if subject:
        q = q.filter(Assignment.subject == subject)
    return q.all()

def submit_assignment(db: Session, assignment_id: int, student_id: int, file_path: Optional[str], remarks: Optional[str]) -> AssignmentSubmission:
    existing = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id,
        AssignmentSubmission.student_id == student_id
    ).first()
    if existing:
        existing.file_path = file_path
        existing.remarks = remarks
        db.commit()
        db.refresh(existing)
        return existing
    obj = AssignmentSubmission(assignment_id=assignment_id, student_id=student_id, file_path=file_path, remarks=remarks)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def grade_submission(db: Session, submission_id: int, data: SubmissionGrade, graded_by: int):
    from datetime import datetime
    obj = db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()
    if not obj:
        return None
    obj.grade = data.grade
    obj.score = data.score
    obj.feedback = data.feedback
    obj.graded_by = graded_by
    obj.graded_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj
