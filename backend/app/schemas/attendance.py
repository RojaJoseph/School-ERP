from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class AttendanceStatusEnum(str, Enum):
    present = "present"
    absent  = "absent"
    late    = "late"
    leave   = "leave"
    holiday = "holiday"

class AttendanceCreate(BaseModel):
    student_id: int
    class_name: str
    section:    Optional[str] = None
    date:       date
    status:     AttendanceStatusEnum
    remarks:    Optional[str] = None

class AttendanceEntry(BaseModel):
    student_id: int
    status:     AttendanceStatusEnum
    remarks:    Optional[str] = None

class BulkAttendanceCreate(BaseModel):
    class_name:  str
    section:     Optional[str] = None
    date:        date
    records:     List[AttendanceEntry]

class AttendanceUpdate(BaseModel):
    status:  Optional[AttendanceStatusEnum] = None
    remarks: Optional[str] = None

class AttendanceResponse(BaseModel):
    id:         int
    student_id: int
    class_name: str
    section:    Optional[str]
    date:       date
    status:     AttendanceStatusEnum
    remarks:    Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceSummary(BaseModel):
    student_id:     int
    total_days:     int
    present_days:   int
    absent_days:    int
    late_days:      int
    leave_days:     int
    percentage:     float
