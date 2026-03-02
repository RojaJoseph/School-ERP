from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from app.db.base import get_db
from app.models.admission import Admission, AdmissionStatusEnum
from app.schemas.admission import AdmissionCreate, AdmissionUpdate, AdmissionResponse
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/admissions", tags=["Admissions"])

@router.post("/", response_model=AdmissionResponse, status_code=201)
def create_admission(data: AdmissionCreate, db: Session = Depends(get_db)):
    if db.query(Admission).filter(Admission.application_no == data.application_no).first():
        raise HTTPException(status_code=400, detail="Application number already exists")
    admission = Admission(**data.model_dump())
    db.add(admission)
    db.commit()
    db.refresh(admission)
    return admission

@router.get("/", response_model=List[AdmissionResponse])
def list_admissions(
    status: Optional[str]  = Query(None),
    academic_year: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    q = db.query(Admission)
    if status:
        q = q.filter(Admission.status == status)
    if academic_year:
        q = q.filter(Admission.academic_year == academic_year)
    return q.all()

@router.get("/{admission_id}", response_model=AdmissionResponse)
def get_admission(admission_id: int, db: Session = Depends(get_db)):
    a = db.query(Admission).filter(Admission.id == admission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Admission not found")
    return a

@router.put("/{admission_id}", response_model=AdmissionResponse)
def update_admission(admission_id: int, data: AdmissionUpdate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    a = db.query(Admission).filter(Admission.id == admission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Admission not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a

@router.delete("/{admission_id}", status_code=204)
def delete_admission(admission_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    a = db.query(Admission).filter(Admission.id == admission_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Admission not found")
    db.delete(a)
    db.commit()
