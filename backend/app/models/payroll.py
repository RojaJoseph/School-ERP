from sqlalchemy import Column, String, Integer, Date, DateTime, Float, Text, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class EmployeeTypeEnum(str, enum.Enum):
    teaching     = "teaching"
    non_teaching = "non_teaching"
    admin        = "admin"
    support      = "support"

class LeaveStatusEnum(str, enum.Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"

class Employee(Base):
    __tablename__ = "employees"

    id              = Column(Integer, primary_key=True, index=True)
    emp_code        = Column(String(50), unique=True, nullable=False, index=True)
    user_id         = Column(Integer, ForeignKey("users.id"), nullable=True)
    first_name      = Column(String(100), nullable=False)
    last_name       = Column(String(100), nullable=False)
    date_of_birth   = Column(Date, nullable=True)
    gender          = Column(String(20), nullable=True)
    email           = Column(String(150), nullable=True)
    phone           = Column(String(20), nullable=True)
    address         = Column(Text, nullable=True)
    department      = Column(String(100), nullable=True)
    designation     = Column(String(100), nullable=True)
    employee_type   = Column(Enum(EmployeeTypeEnum), default=EmployeeTypeEnum.teaching)
    join_date       = Column(Date, nullable=True)
    salary          = Column(Float, default=0)
    bank_account    = Column(String(100), nullable=True)
    bank_name       = Column(String(100), nullable=True)
    ifsc_code       = Column(String(50), nullable=True)
    pan_number      = Column(String(50), nullable=True)
    aadhar_number   = Column(String(50), nullable=True)
    photo           = Column(String(255), nullable=True)
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id           = Column(Integer, primary_key=True, index=True)
    employee_id  = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    leave_type   = Column(String(50), nullable=False)
    from_date    = Column(Date, nullable=False)
    to_date      = Column(Date, nullable=False)
    reason       = Column(Text, nullable=True)
    status       = Column(Enum(LeaveStatusEnum), default=LeaveStatusEnum.pending)
    approved_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at  = Column(DateTime(timezone=True), nullable=True)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

class Payroll(Base):
    __tablename__ = "payroll"

    id              = Column(Integer, primary_key=True, index=True)
    employee_id     = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    month           = Column(Integer, nullable=False)
    year            = Column(Integer, nullable=False)
    basic_salary    = Column(Float, default=0)
    allowances      = Column(Float, default=0)
    deductions      = Column(Float, default=0)
    tax             = Column(Float, default=0)
    net_salary      = Column(Float, default=0)
    working_days    = Column(Integer, default=0)
    present_days    = Column(Integer, default=0)
    leave_days      = Column(Integer, default=0)
    payslip_path    = Column(String(255), nullable=True)
    paid_at         = Column(DateTime(timezone=True), nullable=True)
    generated_by    = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
