from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class AnnouncementCreate(BaseModel):
    title:      str
    content:    str
    target:     str = "all"
    class_name: Optional[str] = None
    priority:   str = "normal"

class AnnouncementResponse(BaseModel):
    id:         int
    title:      str
    content:    str
    target:     str
    class_name: Optional[str]
    priority:   str
    created_at: datetime
    class Config:
        from_attributes = True

class HomeworkCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    class_name:  str
    section:     Optional[str] = None
    subject:     str
    due_date:    date

class HomeworkResponse(BaseModel):
    id:          int
    title:       str
    description: Optional[str]
    class_name:  str
    section:     Optional[str]
    subject:     str
    due_date:    date
    created_at:  datetime
    class Config:
        from_attributes = True

class RemarkCreate(BaseModel):
    student_id:  int
    remark:      str
    remark_type: str = "general"

class RemarkResponse(BaseModel):
    id:          int
    student_id:  int
    remark:      str
    remark_type: str
    created_at:  datetime
    class Config:
        from_attributes = True

class StudentLeaveCreate(BaseModel):
    student_id: int
    from_date:  date
    to_date:    date
    reason:     str

class StudentLeaveResponse(BaseModel):
    id:          int
    student_id:  int
    from_date:   date
    to_date:     date
    reason:      str
    status:      str
    review_note: Optional[str]
    created_at:  datetime
    class Config:
        from_attributes = True

class GalleryCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    image_url:   str
    class_name:  Optional[str] = None

class GalleryResponse(BaseModel):
    id:          int
    title:       str
    description: Optional[str]
    image_url:   str
    class_name:  Optional[str]
    created_at:  datetime
    class Config:
        from_attributes = True

class CalendarEventCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    event_date:  date
    end_date:    Optional[date] = None
    event_type:  str = "general"
    class_name:  Optional[str] = None

class CalendarEventResponse(BaseModel):
    id:          int
    title:       str
    description: Optional[str]
    event_date:  date
    end_date:    Optional[date]
    event_type:  str
    class_name:  Optional[str]
    created_at:  datetime
    class Config:
        from_attributes = True

class ProjectCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    class_name:  str
    section:     Optional[str] = None
    subject:     str
    due_date:    date
    max_marks:   int = 100

class ProjectResponse(BaseModel):
    id:          int
    title:       str
    description: Optional[str]
    class_name:  str
    section:     Optional[str]
    subject:     str
    due_date:    date
    max_marks:   int
    created_at:  datetime
    class Config:
        from_attributes = True

# Student portal login
class StudentPortalLogin(BaseModel):
    name:  str
    phone: str
