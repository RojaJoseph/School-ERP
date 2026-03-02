from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.db.base import get_db
from app.schemas.communication import NotificationCreate, MessageCreate
from app.crud.crud_communication import (
    create_notification, get_notifications,
    send_message, get_inbox, get_sent, mark_as_read
)
from app.core.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/communication", tags=["Communication"])

# ── Notifications ────────────────────────────────────
@router.post("/notifications", status_code=201)
def send_notification(data: NotificationCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return create_notification(db, data, current_user.id)

@router.get("/notifications")
def list_notifications(target_role: Optional[str] = None, page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    return get_notifications(db, target_role, skip, per_page)

# ── Messages ─────────────────────────────────────────
@router.post("/messages", status_code=201)
def create_message(data: MessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return send_message(db, data, current_user.id)

@router.get("/messages/inbox")
def inbox(page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    return get_inbox(db, current_user.id, skip, per_page)

@router.get("/messages/sent")
def sent(page: int = 1, per_page: int = 20, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    skip = (page - 1) * per_page
    return get_sent(db, current_user.id, skip, per_page)

@router.patch("/messages/{message_id}/read")
def read_message(message_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = mark_as_read(db, message_id, current_user.id)
    if not obj:
        raise HTTPException(status_code=404, detail="Message not found")
    return obj
