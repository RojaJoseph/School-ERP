from pydantic import BaseModel
from typing import Optional

class TimetableEntryBase(BaseModel):
    class_name:    str
    section:       str = "A"
    academic_year: str
    day_of_week:   str
    period_no:     int
    subject:       str
    teacher_name:  Optional[str] = None
    start_time:    Optional[str] = None
    end_time:      Optional[str] = None
    room_no:       Optional[str] = None

class TimetableEntryCreate(TimetableEntryBase): pass

class TimetableEntryUpdate(BaseModel):
    subject:      Optional[str] = None
    teacher_name: Optional[str] = None
    start_time:   Optional[str] = None
    end_time:     Optional[str] = None
    room_no:      Optional[str] = None

class TimetableEntryResponse(TimetableEntryBase):
    id:        int
    is_active: bool
    class Config:
        from_attributes = True
