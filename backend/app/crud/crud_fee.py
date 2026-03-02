from sqlalchemy.orm import Session
from datetime import datetime
import uuid
from app.models.fee import FeeStructure, FeePayment
from app.schemas.fee import FeeStructureCreate, FeePaymentCreate, FeePaymentUpdate
from typing import Optional

def create_fee_structure(db: Session, data: FeeStructureCreate) -> FeeStructure:
    obj = FeeStructure(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_fee_structures(db: Session, class_name: Optional[str] = None, academic_year: Optional[str] = None):
    q = db.query(FeeStructure).filter(FeeStructure.is_active == True)
    if class_name:
        q = q.filter(FeeStructure.class_name == class_name)
    if academic_year:
        q = q.filter(FeeStructure.academic_year == academic_year)
    return q.all()

def create_fee_payment(db: Session, data: FeePaymentCreate, collected_by: int) -> FeePayment:
    invoice_no = f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
    obj = FeePayment(
        **data.model_dump(),
        invoice_no=invoice_no,
        collected_by=collected_by
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_fee_payments(db: Session, student_id: Optional[int] = None, status: Optional[str] = None, skip=0, limit=20):
    q = db.query(FeePayment)
    if student_id:
        q = q.filter(FeePayment.student_id == student_id)
    if status:
        q = q.filter(FeePayment.status == status)
    total = q.count()
    return total, q.offset(skip).limit(limit).all()

def get_fee_payment(db: Session, payment_id: int) -> Optional[FeePayment]:
    return db.query(FeePayment).filter(FeePayment.id == payment_id).first()

def update_fee_payment(db: Session, payment_id: int, data: FeePaymentUpdate) -> Optional[FeePayment]:
    obj = get_fee_payment(db, payment_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    if data.status == "paid":
        obj.paid_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj
