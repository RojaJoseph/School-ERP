from sqlalchemy.orm import Session
from app.models.admission import Admission
from app.schemas.admission import AdmissionCreate, AdmissionUpdate
from typing import Optional

def create_admission(db: Session, data: AdmissionCreate) -> Admission:
    obj = Admission(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_admission(db: Session, admission_id: int) -> Optional[Admission]:
    return db.query(Admission).filter(Admission.id == admission_id).first()

def get_admissions(db: Session, skip=0, limit=20, status=None, academic_year=None):
    q = db.query(Admission)
    if status:
        q = q.filter(Admission.status == status)
    if academic_year:
        q = q.filter(Admission.academic_year == academic_year)
    total = q.count()
    return total, q.offset(skip).limit(limit).all()

def update_admission(db: Session, admission_id: int, data: AdmissionUpdate, reviewed_by: int) -> Optional[Admission]:
    from datetime import datetime
    obj = get_admission(db, admission_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    obj.reviewed_by = reviewed_by
    obj.reviewed_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj
