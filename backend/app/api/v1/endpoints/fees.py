from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional
from app.db.base import get_db
from app.schemas.fee import FeeStructureCreate, FeePaymentCreate, FeePaymentUpdate
from app.crud.crud_fee import (
    create_fee_structure, get_fee_structures,
    create_fee_payment, get_fee_payments, get_fee_payment, update_fee_payment
)
from app.core.dependencies import get_current_user, require_roles
from app.core.email import send_fee_receipt
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/fees", tags=["Fees & Payments"])

# ── Fee Structures ───────────────────────────────────
@router.post("/structures", status_code=201)
def create_structure(
    data: FeeStructureCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.school_admin, RoleEnum.accountant))
):
    return create_fee_structure(db, data)

@router.get("/structures")
def list_structures(
    class_name: Optional[str] = None,
    academic_year: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_fee_structures(db, class_name, academic_year)

# ── Fee Payments ─────────────────────────────────────
@router.post("/payments", status_code=201)
def create_payment(
    data: FeePaymentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    payment = create_fee_payment(db, data, current_user.id)

    # Send receipt email in background if student has guardian email
    from app.crud.crud_student import get_student
    student = get_student(db, data.student_id)
    if student and student.guardian_email and payment.status == "paid":
        background_tasks.add_task(
            send_fee_receipt,
            to=student.guardian_email,
            student_name=f"{student.first_name} {student.last_name}",
            invoice_no=payment.invoice_no,
            amount=payment.paid_amount,
            paid_at=str(payment.paid_at or ""),
        )

    return payment

@router.get("/payments")
def list_payments(
    student_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    skip = (page - 1) * per_page
    total, payments = get_fee_payments(db, student_id, status, skip, per_page)
    return {"total": total, "page": page, "per_page": per_page, "payments": payments}

@router.get("/payments/{payment_id}")
def get_payment(
    payment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = get_fee_payment(db, payment_id)
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p

@router.put("/payments/{payment_id}")
def update_payment(
    payment_id: int,
    data: FeePaymentUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    p = update_fee_payment(db, payment_id, data)
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Send receipt on marking as paid
    if data.status == "paid":
        from app.crud.crud_student import get_student
        student = get_student(db, p.student_id)
        if student and student.guardian_email:
            background_tasks.add_task(
                send_fee_receipt,
                to=student.guardian_email,
                student_name=f"{student.first_name} {student.last_name}",
                invoice_no=p.invoice_no,
                amount=p.paid_amount,
                paid_at=str(p.paid_at or ""),
            )
    return p
