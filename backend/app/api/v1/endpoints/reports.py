from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app.db.base import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.attendance import Attendance
from app.models.fee import FeePayment
from app.models.payroll import Employee, Payroll
from app.models.exam import ExamResult
from sqlalchemy import func

router = APIRouter(prefix="/reports", tags=["Reports"])

# ── Dashboard Summary ────────────────────────────────
@router.get("/dashboard")
def dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    total_students  = db.query(Student).filter(Student.is_active == True).count()
    total_employees = db.query(Employee).filter(Employee.is_active == True).count()
    total_fees_collected = db.query(func.sum(FeePayment.paid_amount)).filter(FeePayment.status == "paid").scalar() or 0
    total_fees_pending   = db.query(func.sum(FeePayment.paid_amount)).filter(FeePayment.status == "pending").scalar() or 0
    return {
        "total_students":       total_students,
        "total_employees":      total_employees,
        "fees_collected":       total_fees_collected,
        "fees_pending":         total_fees_pending,
    }

# ── Attendance Report ────────────────────────────────
@router.get("/attendance")
def attendance_report(
    class_name:    Optional[str]  = Query(None),
    section:       Optional[str]  = Query(None),
    from_date:     Optional[date] = Query(None),
    to_date:       Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Attendance)
    if class_name:
        q = q.join(Student).filter(Student.class_name == class_name)
    if section:
        q = q.join(Student).filter(Student.section == section)
    if from_date:
        q = q.filter(Attendance.date >= from_date)
    if to_date:
        q = q.filter(Attendance.date <= to_date)
    records = q.all()
    total = len(records)
    present = sum(1 for r in records if r.status == "present")
    absent  = sum(1 for r in records if r.status == "absent")
    return {"total": total, "present": present, "absent": absent, "records": records}

# ── Fee Collection Report ────────────────────────────
@router.get("/fees")
def fee_report(
    academic_year: Optional[str] = Query(None),
    class_name:    Optional[str] = Query(None),
    from_date:     Optional[date] = Query(None),
    to_date:       Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(FeePayment)
    if from_date:
        q = q.filter(FeePayment.paid_at >= from_date)
    if to_date:
        q = q.filter(FeePayment.paid_at <= to_date)
    payments = q.all()
    total_collected = sum(p.paid_amount for p in payments if p.status == "paid")
    total_pending   = sum(p.amount - p.paid_amount for p in payments if p.status == "pending")
    return {"total_collected": total_collected, "total_pending": total_pending, "records": payments}

# ── Payroll Report ───────────────────────────────────
@router.get("/payroll")
def payroll_report(
    month: Optional[int] = Query(None),
    year:  Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(Payroll)
    if month:
        q = q.filter(Payroll.month == month)
    if year:
        q = q.filter(Payroll.year == year)
    payrolls = q.all()
    total_net = sum(p.net_salary for p in payrolls)
    return {"total_net_salary": total_net, "count": len(payrolls), "records": payrolls}

# ── Exam Result Report ───────────────────────────────
@router.get("/exam-results")
def exam_result_report(
    exam_id:    Optional[int] = Query(None),
    class_name: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    q = db.query(ExamResult)
    if exam_id:
        q = q.filter(ExamResult.exam_id == exam_id)
    results = q.all()
    passed = sum(1 for r in results if r.grade and r.grade != "F")
    failed = sum(1 for r in results if r.grade == "F")
    absent = sum(1 for r in results if r.is_absent)
    return {"total": len(results), "passed": passed, "failed": failed, "absent": absent, "records": results}
