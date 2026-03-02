from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

class FeeStatusEnum(str, Enum):
    pending = "pending"
    paid    = "paid"
    overdue = "overdue"
    partial = "partial"
    waived  = "waived"

class PaymentMethodEnum(str, Enum):
    cash   = "cash"
    online = "online"
    cheque = "cheque"
    dd     = "dd"
    stripe = "stripe"

class FeeStructureCreate(BaseModel):
    name:          str
    class_name:    str
    academic_year: str
    amount:        float
    due_date:      date
    description:   Optional[str] = None

class FeeStructureResponse(FeeStructureCreate):
    id:         int
    is_active:  bool
    created_at: datetime
    class Config:
        from_attributes = True

class FeePaymentCreate(BaseModel):
    student_id:       int
    fee_structure_id: Optional[int] = None
    amount:           float
    discount:         float = 0
    fine:             float = 0
    due_date:         Optional[date] = None
    remarks:          Optional[str] = None

class FeePaymentUpdate(BaseModel):
    paid_amount:     Optional[float] = None
    status:          Optional[FeeStatusEnum] = None
    payment_method:  Optional[PaymentMethodEnum] = None
    remarks:         Optional[str] = None

class FeePaymentResponse(BaseModel):
    id:               int
    student_id:       int
    invoice_no:       str
    amount:           float
    discount:         float
    fine:             float
    paid_amount:      float
    status:           FeeStatusEnum
    payment_method:   Optional[PaymentMethodEnum]
    due_date:         Optional[date]
    paid_at:          Optional[datetime]
    created_at:       datetime
    class Config:
        from_attributes = True
