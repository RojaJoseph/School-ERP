from sqlalchemy import Column, String, Integer, Date, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class GenderEnum(str, enum.Enum):
    male = "male"
    female = "female"
    other = "other"

class BloodGroupEnum(str, enum.Enum):
    A_pos = "A+"
    A_neg = "A-"
    B_pos = "B+"
    B_neg = "B-"
    O_pos = "O+"
    O_neg = "O-"
    AB_pos = "AB+"
    AB_neg = "AB-"

class Student(Base):
    __tablename__ = "students"

    id              = Column(Integer, primary_key=True, index=True)
    admission_no    = Column(String(50), unique=True, nullable=False, index=True)
    roll_no         = Column(String(50), nullable=True)
    first_name      = Column(String(100), nullable=False)
    last_name       = Column(String(100), nullable=False)
    date_of_birth   = Column(Date, nullable=False)
    gender          = Column(Enum(GenderEnum), nullable=False)
    blood_group     = Column(Enum(BloodGroupEnum), nullable=True)
    religion        = Column(String(50), nullable=True)
    caste           = Column(String(50), nullable=True)
    nationality     = Column(String(50), default="Indian")
    email           = Column(String(150), nullable=True)
    phone           = Column(String(20), nullable=True)
    address         = Column(Text, nullable=True)
    city            = Column(String(100), nullable=True)
    state           = Column(String(100), nullable=True)
    pincode         = Column(String(20), nullable=True)
    photo           = Column(String(255), nullable=True)  # file path

    # Class & Section
    class_name      = Column(String(50), nullable=False)
    section         = Column(String(10), nullable=True)
    academic_year   = Column(String(20), nullable=False)

    # Guardian Details
    guardian_name   = Column(String(150), nullable=False)
    guardian_relation = Column(String(50), nullable=True)
    guardian_phone  = Column(String(20), nullable=False)
    guardian_email  = Column(String(150), nullable=True)
    guardian_occupation = Column(String(100), nullable=True)
    guardian_address = Column(Text, nullable=True)

    # Documents
    birth_certificate = Column(String(255), nullable=True)
    transfer_certificate = Column(String(255), nullable=True)
    aadhar_card     = Column(String(255), nullable=True)

    # Status
    is_active       = Column(Boolean, default=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())
