from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import date, datetime
from enum import Enum

class GenderEnum(str, Enum):
    male = "male"
    female = "female"
    other = "other"

class BloodGroupEnum(str, Enum):
    A_pos = "A+"
    A_neg = "A-"
    B_pos = "B+"
    B_neg = "B-"
    O_pos = "O+"
    O_neg = "O-"
    AB_pos = "AB+"
    AB_neg = "AB-"

# ── Base ─────────────────────────────────────────────
class StudentBase(BaseModel):
    admission_no:        str
    roll_no:             Optional[str] = None
    first_name:          str
    last_name:           str
    date_of_birth:       date
    gender:              GenderEnum
    blood_group:         Optional[BloodGroupEnum] = None
    religion:            Optional[str] = None
    caste:               Optional[str] = None
    nationality:         Optional[str] = "Indian"
    email:               Optional[str] = None
    phone:               Optional[str] = None
    address:             Optional[str] = None
    city:                Optional[str] = None
    state:               Optional[str] = None
    pincode:             Optional[str] = None
    class_name:          str
    section:             Optional[str] = None
    academic_year:       str
    guardian_name:       str
    guardian_relation:   Optional[str] = None
    guardian_phone:      str
    guardian_email:      Optional[str] = None
    guardian_occupation: Optional[str] = None
    guardian_address:    Optional[str] = None

# ── Create ───────────────────────────────────────────
class StudentCreate(StudentBase):
    pass

# ── Update ───────────────────────────────────────────
class StudentUpdate(BaseModel):
    roll_no:             Optional[str] = None
    first_name:          Optional[str] = None
    last_name:           Optional[str] = None
    date_of_birth:       Optional[date] = None
    gender:              Optional[GenderEnum] = None
    blood_group:         Optional[BloodGroupEnum] = None
    religion:            Optional[str] = None
    phone:               Optional[str] = None
    address:             Optional[str] = None
    city:                Optional[str] = None
    state:               Optional[str] = None
    class_name:          Optional[str] = None
    section:             Optional[str] = None
    academic_year:       Optional[str] = None
    guardian_name:       Optional[str] = None
    guardian_phone:      Optional[str] = None
    is_active:           Optional[bool] = None

# ── Response ─────────────────────────────────────────
class StudentResponse(StudentBase):
    id:         int
    photo:      Optional[str] = None
    is_active:  bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ── List Response ─────────────────────────────────────
class StudentListResponse(BaseModel):
    total:    int
    page:     int
    per_page: int
    students: list[StudentResponse]
