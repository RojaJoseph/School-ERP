from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from typing import Optional
import shutil, os, uuid

from app.db.base import get_db
from app.schemas.student import (
    StudentCreate, StudentUpdate,
    StudentResponse, StudentListResponse
)
from app.crud.crud_student import (
    create_student, get_student, get_students,
    update_student, deactivate_student, delete_student,
    get_student_by_admission_no,
    update_student_photo, update_student_document,
    bulk_import_students,
)

router = APIRouter(prefix="/students", tags=["Students"])

UPLOAD_DIR = "uploads/students"

# ── Create Student ───────────────────────────────────
@router.post("", response_model=StudentResponse, status_code=status.HTTP_201_CREATED)
def create_new_student(data: StudentCreate, db: Session = Depends(get_db)):
    existing = get_student_by_admission_no(db, data.admission_no)
    if existing:
        raise HTTPException(status_code=400, detail="Admission number already exists")
    return create_student(db, data)

# ── Get All Students ─────────────────────────────────
@router.get("", response_model=StudentListResponse)
def list_students(
    page:          int           = Query(1, ge=1),
    per_page:      int           = Query(10, ge=1, le=100),
    search:        Optional[str] = Query(None),
    class_name:    Optional[str] = Query(None),
    section:       Optional[str] = Query(None),
    academic_year: Optional[str] = Query(None),
    is_active:     Optional[bool]= Query(True),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * per_page
    total, students = get_students(
        db, skip=skip, limit=per_page,
        search=search, class_name=class_name,
        section=section, academic_year=academic_year,
        is_active=is_active
    )
    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "students": students
    }

# ── Get Single Student ───────────────────────────────
@router.get("/{student_id}", response_model=StudentResponse)
def get_single_student(student_id: int, db: Session = Depends(get_db)):
    student = get_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ── Update Student ───────────────────────────────────
@router.put("/{student_id}", response_model=StudentResponse)
def update_student_info(
    student_id: int,
    data: StudentUpdate,
    db: Session = Depends(get_db)
):
    student = update_student(db, student_id, data)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ── Upload Photo ─────────────────────────────────────
@router.post("/{student_id}/photo", response_model=StudentResponse)
def upload_photo(
    student_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/jpg"]:
        raise HTTPException(status_code=400, detail="Only JPG/PNG images allowed")

    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, filename)
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    student = update_student_photo(db, student_id, path)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ── Upload Document ──────────────────────────────────
@router.post("/{student_id}/document/{doc_type}")
def upload_document(
    student_id: int,
    doc_type:   str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    allowed_docs = ["birth_certificate", "transfer_certificate", "aadhar_card"]
    if doc_type not in allowed_docs:
        raise HTTPException(status_code=400, detail=f"doc_type must be one of {allowed_docs}")

    filename = f"{uuid.uuid4()}_{file.filename}"
    path = os.path.join(UPLOAD_DIR, "docs", filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    student = update_student_document(db, student_id, doc_type, path)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Document uploaded", "path": path}

# ── Bulk CSV Import ─────────────────────────────────
@router.post("/import")
async def import_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    content = await file.read()
    try:
        csv_text = content.decode('utf-8-sig')  # handles BOM
    except UnicodeDecodeError:
        csv_text = content.decode('latin-1')
    results = bulk_import_students(db, csv_text)
    success = sum(1 for r in results if r['status'] == 'success')
    return {
        "total":   len(results),
        "success": success,
        "failed":  sum(1 for r in results if r['status'] == 'error'),
        "skipped": sum(1 for r in results if r['status'] == 'skipped'),
        "results": results,
    }

# ── Deactivate Student (Soft Delete) ─────────────────
@router.patch("/{student_id}/deactivate", response_model=StudentResponse)
def deactivate(student_id: int, db: Session = Depends(get_db)):
    student = deactivate_student(db, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

# ── Delete Student (Hard Delete) ─────────────────────
@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete(student_id: int, db: Session = Depends(get_db)):
    success = delete_student(db, student_id)
    if not success:
        raise HTTPException(status_code=404, detail="Student not found")
