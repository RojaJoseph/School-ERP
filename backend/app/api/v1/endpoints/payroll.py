from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.base import get_db
from app.schemas.payroll import EmployeeCreate, EmployeeUpdate, LeaveCreate, PayrollCreate
from app.crud.crud_payroll import (
    create_employee, get_employee, get_employees, update_employee,
    create_leave, get_leaves, update_leave_status,
    generate_payroll, get_payrolls
)
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/hr", tags=["HR & Payroll"])

# ── Employees ────────────────────────────────────────
@router.post("/employees", status_code=201)
def create_emp(data: EmployeeCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.hr_manager, RoleEnum.school_admin))):
    return create_employee(db, data)

@router.get("/employees")
def list_employees(department: Optional[str] = None, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    total, employees = get_employees(db, department, True, skip, per_page)
    return {"total": total, "page": page, "per_page": per_page, "employees": employees}

@router.get("/employees/{emp_id}")
def get_emp(emp_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    emp = get_employee(db, emp_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

@router.put("/employees/{emp_id}")
def update_emp(emp_id: int, data: EmployeeUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.hr_manager, RoleEnum.school_admin))):
    emp = update_employee(db, emp_id, data)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp

# ── Leave Requests ───────────────────────────────────
@router.post("/leaves", status_code=201)
def apply_leave(data: LeaveCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_leave(db, data)

@router.get("/leaves")
def list_leaves(employee_id: Optional[int] = None, status: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_leaves(db, employee_id, status)

@router.patch("/leaves/{leave_id}/approve")
def approve_leave(leave_id: int, status: str, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.hr_manager, RoleEnum.school_admin))):
    obj = update_leave_status(db, leave_id, status, current_user.id)
    if not obj:
        raise HTTPException(status_code=404, detail="Leave not found")
    return obj

# ── Payroll ──────────────────────────────────────────
@router.post("/payroll", status_code=201)
def create_payroll(data: PayrollCreate, db: Session = Depends(get_db), current_user: User = Depends(require_roles(RoleEnum.hr_manager, RoleEnum.school_admin))):
    return generate_payroll(db, data, current_user.id)

@router.get("/payroll")
def list_payroll(employee_id: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_payrolls(db, employee_id, month, year)
