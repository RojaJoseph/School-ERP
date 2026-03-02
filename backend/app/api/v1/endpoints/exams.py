from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import shutil, os, uuid
from app.db.base import get_db
from app.schemas.exam import ExamCreate, ExamUpdate, BulkResultCreate, AssignmentCreate, SubmissionGrade
from app.crud.crud_exam import (
    create_exam, get_exams, get_exam,
    bulk_save_results, get_results_by_exam, get_results_by_student,
    create_assignment, get_assignments, submit_assignment, grade_submission
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/exams", tags=["Exams & Assignments"])
UPLOAD_DIR = "uploads/assignments"

# ── Exams ────────────────────────────────────────────
@router.post("/", status_code=201)
def create_new_exam(data: ExamCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_exam(db, data, current_user.id)

@router.get("/")
def list_exams(class_name: Optional[str] = None, academic_year: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_exams(db, class_name, academic_year)

@router.get("/{exam_id}")
def get_single_exam(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    exam = get_exam(db, exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    return exam

# ── Marks Entry ──────────────────────────────────────
@router.post("/{exam_id}/results/bulk")
def enter_results(exam_id: int, data: BulkResultCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    data.exam_id = exam_id
    return bulk_save_results(db, data, current_user.id)

@router.get("/{exam_id}/results")
def exam_results(exam_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_results_by_exam(db, exam_id)

@router.get("/results/student/{student_id}")
def student_results(student_id: int, academic_year: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_results_by_student(db, student_id, academic_year)

# ── Assignments ──────────────────────────────────────
@router.post("/assignments", status_code=201)
def create_new_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_assignment(db, data, current_user.id)

@router.get("/assignments")
def list_assignments(class_name: Optional[str] = None, subject: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_assignments(db, class_name, subject)

@router.post("/assignments/{assignment_id}/submit")
def submit(
    assignment_id: int,
    student_id: int,
    remarks: Optional[str] = None,
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    file_path = None
    if file:
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        filename = f"{uuid.uuid4()}_{file.filename}"
        file_path = os.path.join(UPLOAD_DIR, filename)
        with open(file_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
    return submit_assignment(db, assignment_id, student_id, file_path, remarks)

@router.post("/submissions/{submission_id}/grade")
def grade(submission_id: int, data: SubmissionGrade, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = grade_submission(db, submission_id, data, current_user.id)
    if not obj:
        raise HTTPException(status_code=404, detail="Submission not found")
    return obj
