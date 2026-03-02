from sqlalchemy.orm import Session
from datetime import datetime
from app.models.payroll import Employee, LeaveRequest, Payroll
from app.schemas.payroll import EmployeeCreate, EmployeeUpdate, LeaveCreate, PayrollCreate
from typing import Optional

# ─── Employee ────────────────────────────────────────
def create_employee(db: Session, data: EmployeeCreate) -> Employee:
    obj = Employee(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_employee(db: Session, emp_id: int) -> Optional[Employee]:
    return db.query(Employee).filter(Employee.id == emp_id).first()

def get_employees(db: Session, department: Optional[str] = None, is_active: bool = True, skip=0, limit=50):
    q = db.query(Employee).filter(Employee.is_active == is_active)
    if department:
        q = q.filter(Employee.department == department)
    total = q.count()
    return total, q.offset(skip).limit(limit).all()

def update_employee(db: Session, emp_id: int, data: EmployeeUpdate) -> Optional[Employee]:
    obj = get_employee(db, emp_id)
    if not obj:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj

# ─── Leave ───────────────────────────────────────────
def create_leave(db: Session, data: LeaveCreate) -> LeaveRequest:
    obj = LeaveRequest(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_leaves(db: Session, employee_id: Optional[int] = None, status: Optional[str] = None):
    q = db.query(LeaveRequest)
    if employee_id:
        q = q.filter(LeaveRequest.employee_id == employee_id)
    if status:
        q = q.filter(LeaveRequest.status == status)
    return q.all()

def update_leave_status(db: Session, leave_id: int, status: str, approved_by: int) -> Optional[LeaveRequest]:
    obj = db.query(LeaveRequest).filter(LeaveRequest.id == leave_id).first()
    if not obj:
        return None
    obj.status = status
    obj.approved_by = approved_by
    obj.approved_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj

# ─── Payroll ─────────────────────────────────────────
def generate_payroll(db: Session, data: PayrollCreate, generated_by: int) -> Payroll:
    net = data.basic_salary + data.allowances - data.deductions - data.tax
    obj = Payroll(**data.model_dump(), net_salary=net, generated_by=generated_by)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_payrolls(db: Session, employee_id: Optional[int] = None, month: Optional[int] = None, year: Optional[int] = None):
    q = db.query(Payroll)
    if employee_id:
        q = q.filter(Payroll.employee_id == employee_id)
    if month:
        q = q.filter(Payroll.month == month)
    if year:
        q = q.filter(Payroll.year == year)
    return q.all()
