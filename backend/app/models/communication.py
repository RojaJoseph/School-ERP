from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, Boolean, Enum
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class NotificationTypeEnum(str, enum.Enum):
    email = "email"
    sms   = "sms"
    push  = "push"
    internal = "internal"

class NotificationStatusEnum(str, enum.Enum):
    pending = "pending"
    sent    = "sent"
    failed  = "failed"

class Notification(Base):
    __tablename__ = "notifications"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String(255), nullable=False)
    message     = Column(Text, nullable=False)
    type        = Column(Enum(NotificationTypeEnum), default=NotificationTypeEnum.internal)
    target_role = Column(String(50), nullable=True)   # all, teacher, student, parent
    target_id   = Column(Integer, nullable=True)      # specific user id (optional)
    status      = Column(Enum(NotificationStatusEnum), default=NotificationStatusEnum.pending)
    sent_at     = Column(DateTime(timezone=True), nullable=True)
    created_by  = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class Message(Base):
    __tablename__ = "messages"

    id          = Column(Integer, primary_key=True, index=True)
    sender_id   = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    subject     = Column(String(255), nullable=True)
    body        = Column(Text, nullable=False)
    is_read     = Column(Boolean, default=False)
    read_at     = Column(DateTime(timezone=True), nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
