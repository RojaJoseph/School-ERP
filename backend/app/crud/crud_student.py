import csv, io, uuid
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.models.student import Student
from app.schemas.student import StudentCreate, StudentUpdate

# ── Create ───────────────────────────────────────────
def create_student(db: Session, data: StudentCreate) -> Student:
    student = Student(**data.model_dump())
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

# ── Get by ID ────────────────────────────────────────
def get_student(db: Session, student_id: int) -> Optional[Student]:
    return db.query(Student).filter(Student.id == student_id).first()

# ── Get by Admission No ──────────────────────────────
def get_student_by_admission_no(db: Session, admission_no: str) -> Optional[Student]:
    return db.query(Student).filter(Student.admission_no == admission_no).first()

# ── Get All with Filters ─────────────────────────────
def get_students(
    db: Session,
    skip: int = 0,
    limit: int = 10,
    search: Optional[str] = None,
    class_name: Optional[str] = None,
    section: Optional[str] = None,
    academic_year: Optional[str] = None,
    is_active: Optional[bool] = True,
):
    query = db.query(Student)
    if is_active is not None:
        query = query.filter(Student.is_active == is_active)
    if search:
        query = query.filter(or_(
            Student.first_name.ilike(f"%{search}%"),
            Student.last_name.ilike(f"%{search}%"),
            Student.admission_no.ilike(f"%{search}%"),
            Student.phone.ilike(f"%{search}%"),
        ))
    if class_name:
        query = query.filter(Student.class_name == class_name)
    if section:
        query = query.filter(Student.section == section)
    if academic_year:
        query = query.filter(Student.academic_year == academic_year)

    total = query.count()
    return total, query.offset(skip).limit(limit).all()


# ── Bulk Import from CSV ─────────────────────────────
REQUIRED = ['first_name','last_name','date_of_birth','gender',
            'class_name','academic_year','guardian_name','guardian_phone']

def bulk_import_students(db: Session, csv_content: str) -> List[Dict[str, Any]]:
    """Parse CSV string and create students. Returns per-row results."""
    reader  = csv.DictReader(io.StringIO(csv_content))
    results = []

    for idx, row in enumerate(reader, start=2):  # row 1 = header
        # Validate required fields
        missing = [f for f in REQUIRED if not row.get(f, '').strip()]
        if missing:
            results.append({'row': idx, 'status': 'error', 'message': f"Missing: {', '.join(missing)}"})
            continue

        # Generate admission no if absent
        admission_no = row.get('admission_no', '').strip() or f"ADM{uuid.uuid4().hex[:6].upper()}"

        # Skip duplicate admission numbers
        if get_student_by_admission_no(db, admission_no):
            results.append({'row': idx, 'status': 'skipped', 'message': f"Admission no '{admission_no}' already exists"})
            continue

        try:
            student = Student(
                admission_no   = admission_no,
                first_name     = row['first_name'].strip(),
                last_name      = row['last_name'].strip(),
                date_of_birth  = row['date_of_birth'].strip(),
                gender         = row['gender'].strip().lower(),
                class_name     = row['class_name'].strip(),
                section        = row.get('section', '').strip() or None,
                academic_year  = row['academic_year'].strip(),
                roll_no        = row.get('roll_no', '').strip() or None,
                email          = row.get('email', '').strip() or None,
                phone          = row.get('phone', '').strip() or None,
                address        = row.get('address', '').strip() or None,
                city           = row.get('city', '').strip() or None,
                state          = row.get('state', '').strip() or None,
                blood_group    = row.get('blood_group', '').strip() or None,
                guardian_name  = row['guardian_name'].strip(),
                guardian_phone = row['guardian_phone'].strip(),
                guardian_email = row.get('guardian_email', '').strip() or None,
                is_active      = True,
            )
            db.add(student)
            db.flush()  # get id without committing
            results.append({'row': idx, 'status': 'success', 'message': f"Created {student.first_name} {student.last_name}"})
        except Exception as e:
            results.append({'row': idx, 'status': 'error', 'message': str(e)})

    try:
        db.commit()
    except Exception as e:
        db.rollback()
        return [{'row': 0, 'status': 'error', 'message': f'Database commit failed: {e}'}]

    return results


# ── Update ───────────────────────────────────────────
def update_student(db: Session, student_id: int, data: StudentUpdate) -> Optional[Student]:
    student = get_student(db, student_id)
    if not student:
        return None
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    db.commit()
    db.refresh(student)
    return student

# ── Update Photo/Documents ───────────────────────────
def update_student_photo(db: Session, student_id: int, photo_path: str) -> Optional[Student]:
    student = get_student(db, student_id)
    if not student:
        return None
    student.photo = photo_path
    db.commit()
    db.refresh(student)
    return student

def update_student_document(db: Session, student_id: int, doc_type: str, path: str):
    student = get_student(db, student_id)
    if not student:
        return None
    setattr(student, doc_type, path)
    db.commit()
    db.refresh(student)
    return student

# ── Delete (Soft) ────────────────────────────────────
def deactivate_student(db: Session, student_id: int) -> Optional[Student]:
    student = get_student(db, student_id)
    if not student:
        return None
    student.is_active = False
    db.commit()
    db.refresh(student)
    return student

# ── Delete (Hard) ────────────────────────────────────
def delete_student(db: Session, student_id: int) -> bool:
    student = get_student(db, student_id)
    if not student:
        return False
    db.delete(student)
    db.commit()
    return True
