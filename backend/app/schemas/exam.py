from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class ExamTypeEnum(str, Enum):
    unit_test   = "unit_test"
    midterm     = "midterm"
    final       = "final"
    quarterly   = "quarterly"
    half_yearly = "half_yearly"
    annual      = "annual"

class ExamCreate(BaseModel):
    name:          str
    exam_type:     ExamTypeEnum
    class_name:    str
    section:       Optional[str] = None
    subject:       str
    exam_date:     date
    start_time:    Optional[str] = None
    end_time:      Optional[str] = None
    total_marks:   float
    passing_marks: float
    academic_year: str

class ExamUpdate(BaseModel):
    name:          Optional[str] = None
    exam_date:     Optional[date] = None
    start_time:    Optional[str] = None
    end_time:      Optional[str] = None
    total_marks:   Optional[float] = None
    passing_marks: Optional[float] = None

class ExamResponse(ExamCreate):
    id:         int
    created_at: datetime
    class Config:
        from_attributes = True

class ResultEntry(BaseModel):
    student_id: int
    marks:      Optional[float] = None
    is_absent:  bool = False
    remarks:    Optional[str] = None

class BulkResultCreate(BaseModel):
    exam_id:  int
    results:  List[ResultEntry]

class ResultResponse(BaseModel):
    id:         int
    exam_id:    int
    student_id: int
    marks:      Optional[float]
    grade:      Optional[str]
    is_absent:  bool
    remarks:    Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class AssignmentCreate(BaseModel):
    title:       str
    description: Optional[str] = None
    class_name:  str
    section:     Optional[str] = None
    subject:     str
    due_date:    date

class AssignmentResponse(AssignmentCreate):
    id:         int
    file_path:  Optional[str]
    created_at: datetime
    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    remarks: Optional[str] = None

class SubmissionGrade(BaseModel):
    grade:    Optional[str] = None
    score:    Optional[float] = None
    feedback: Optional[str] = None
