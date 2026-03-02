from sqlalchemy import Column, String, Integer, Date, DateTime, Float, Text, ForeignKey, Enum, Boolean
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class FeeStatusEnum(str, enum.Enum):
    pending   = "pending"
    paid      = "paid"
    overdue   = "overdue"
    partial   = "partial"
    waived    = "waived"

class PaymentMethodEnum(str, enum.Enum):
    cash      = "cash"
    online    = "online"
    cheque    = "cheque"
    dd        = "dd"
    stripe    = "stripe"

class FeeStructure(Base):
    __tablename__ = "fee_structures"

    id            = Column(Integer, primary_key=True, index=True)
    name          = Column(String(200), nullable=False)
    class_name    = Column(String(50), nullable=False)
    academic_year = Column(String(20), nullable=False)
    amount        = Column(Float, nullable=False)
    due_date      = Column(Date, nullable=False)
    description   = Column(Text, nullable=True)
    is_active     = Column(Boolean, default=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())

class FeePayment(Base):
    __tablename__ = "fee_payments"

    id               = Column(Integer, primary_key=True, index=True)
    student_id       = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    fee_structure_id = Column(Integer, ForeignKey("fee_structures.id"), nullable=True)
    invoice_no       = Column(String(100), unique=True, nullable=False)
    amount           = Column(Float, nullable=False)
    discount         = Column(Float, default=0)
    fine             = Column(Float, default=0)
    paid_amount      = Column(Float, default=0)
    status           = Column(Enum(FeeStatusEnum), default=FeeStatusEnum.pending)
    payment_method   = Column(Enum(PaymentMethodEnum), nullable=True)
    stripe_payment_id= Column(String(255), nullable=True)
    due_date         = Column(Date, nullable=True)
    paid_at          = Column(DateTime(timezone=True), nullable=True)
    remarks          = Column(Text, nullable=True)
    collected_by     = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at       = Column(DateTime(timezone=True), server_default=func.now())
