from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

class AdmissionStatusEnum(str, Enum):
    applied      = "applied"
    shortlisted  = "shortlisted"
    approved     = "approved"
    rejected     = "rejected"
    enrolled     = "enrolled"

class AdmissionCreate(BaseModel):
    application_no:  str
    applicant_name:  str
    date_of_birth:   date
    gender:          str
    applying_class:  str
    academic_year:   str
    previous_school: Optional[str] = None
    previous_class:  Optional[str] = None
    guardian_name:   str
    guardian_phone:  str
    guardian_email:  Optional[str] = None
    address:         Optional[str] = None
    interview_date:  Optional[date] = None

class AdmissionUpdate(BaseModel):
    status:         Optional[AdmissionStatusEnum] = None
    remarks:        Optional[str] = None
    interview_date: Optional[date] = None
    approved_by:    Optional[int] = None

class AdmissionResponse(AdmissionCreate):
    id:         int
    status:     AdmissionStatusEnum
    remarks:    Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
