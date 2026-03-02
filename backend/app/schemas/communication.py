from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationTypeEnum(str, Enum):
    email    = "email"
    sms      = "sms"
    push     = "push"
    internal = "internal"

class NotificationCreate(BaseModel):
    title:       str
    message:     str
    type:        NotificationTypeEnum = NotificationTypeEnum.internal
    target_role: Optional[str] = None
    target_id:   Optional[int] = None

class NotificationResponse(NotificationCreate):
    id:         int
    status:     str
    created_at: datetime
    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    receiver_id: int
    subject:     Optional[str] = None
    body:        str

class MessageResponse(MessageCreate):
    id:         int
    sender_id:  int
    is_read:    bool
    created_at: datetime
    class Config:
        from_attributes = True
