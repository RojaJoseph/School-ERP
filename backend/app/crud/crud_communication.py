from sqlalchemy.orm import Session
from datetime import datetime
from app.models.communication import Notification, Message
from app.schemas.communication import NotificationCreate, MessageCreate
from typing import Optional

def create_notification(db: Session, data: NotificationCreate, created_by: int) -> Notification:
    obj = Notification(**data.model_dump(), created_by=created_by)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_notifications(db: Session, target_role: Optional[str] = None, skip=0, limit=20):
    q = db.query(Notification)
    if target_role:
        q = q.filter(Notification.target_role == target_role)
    return q.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

def send_message(db: Session, data: MessageCreate, sender_id: int) -> Message:
    obj = Message(**data.model_dump(), sender_id=sender_id)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_inbox(db: Session, user_id: int, skip=0, limit=20):
    return db.query(Message).filter(Message.receiver_id == user_id)\
        .order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

def get_sent(db: Session, user_id: int, skip=0, limit=20):
    return db.query(Message).filter(Message.sender_id == user_id)\
        .order_by(Message.created_at.desc()).offset(skip).limit(limit).all()

def mark_as_read(db: Session, message_id: int, user_id: int) -> Optional[Message]:
    obj = db.query(Message).filter(Message.id == message_id, Message.receiver_id == user_id).first()
    if not obj:
        return None
    obj.is_read = True
    obj.read_at = datetime.utcnow()
    db.commit()
    db.refresh(obj)
    return obj
