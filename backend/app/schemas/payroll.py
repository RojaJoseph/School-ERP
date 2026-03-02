from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

class EmployeeTypeEnum(str, Enum):
    teaching     = "teaching"
    non_teaching = "non_teaching"
    admin        = "admin"
    support      = "support"

class LeaveStatusEnum(str, Enum):
    pending  = "pending"
    approved = "approved"
    rejected = "rejected"

class EmployeeCreate(BaseModel):
    emp_code:      str
    first_name:    str
    last_name:     str
    date_of_birth: Optional[date] = None
    gender:        Optional[str] = None
    email:         Optional[str] = None
    phone:         Optional[str] = None
    address:       Optional[str] = None
    department:    Optional[str] = None
    designation:   Optional[str] = None
    employee_type: EmployeeTypeEnum = EmployeeTypeEnum.teaching
    join_date:     Optional[date] = None
    salary:        float = 0
    bank_account:  Optional[str] = None
    bank_name:     Optional[str] = None
    ifsc_code:     Optional[str] = None
    pan_number:    Optional[str] = None

class EmployeeUpdate(BaseModel):
    first_name:   Optional[str] = None
    last_name:    Optional[str] = None
    phone:        Optional[str] = None
    department:   Optional[str] = None
    designation:  Optional[str] = None
    salary:       Optional[float] = None
    is_active:    Optional[bool] = None

class EmployeeResponse(EmployeeCreate):
    id:         int
    is_active:  bool
    created_at: datetime
    class Config:
        from_attributes = True

class LeaveCreate(BaseModel):
    employee_id: int
    leave_type:  str
    from_date:   date
    to_date:     date
    reason:      Optional[str] = None

class LeaveResponse(LeaveCreate):
    id:         int
    status:     LeaveStatusEnum
    created_at: datetime
    class Config:
        from_attributes = True

class PayrollCreate(BaseModel):
    employee_id:  int
    month:        int
    year:         int
    basic_salary: float
    allowances:   float = 0
    deductions:   float = 0
    tax:          float = 0
    working_days: int = 0
    present_days: int = 0
    leave_days:   int = 0

class PayrollResponse(PayrollCreate):
    id:          int
    net_salary:  float
    created_at:  datetime
    class Config:
        from_attributes = True
