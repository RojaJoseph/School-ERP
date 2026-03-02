from sqlalchemy.orm import Session
from typing import List
from app.models.user import User, UserPermission, RoleEnum
from app.schemas.user import UserCreate, UserUpdate, PermissionSchema
from app.core.security import hash_password

ALL_MODULES = [
    "dashboard", "students", "admissions", "attendance",
    "exams", "fees", "hr", "transport", "library",
    "inventory", "timetable", "reports", "communication", "settings"
]

def get_user(db: Session, user_id: int):
    return db.query(User).filter(User.id == user_id).first()

def get_users(db: Session, role: str = None):
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    return q.order_by(User.full_name).all()

def create_user(db: Session, data: UserCreate) -> User:
    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.password),
        role=data.role,
        is_active=True,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, data: UserUpdate) -> User:
    user = get_user(db, user_id)
    if not user:
        return None
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user

def get_user_permissions(db: Session, user_id: int) -> List[UserPermission]:
    return db.query(UserPermission).filter(UserPermission.user_id == user_id).all()

def save_user_permissions(db: Session, user_id: int, permissions: List[PermissionSchema]) -> List[UserPermission]:
    # Delete existing
    db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()
    db.commit()
    # Insert new
    objs = []
    for p in permissions:
        obj = UserPermission(user_id=user_id, **p.model_dump())
        db.add(obj)
        objs.append(obj)
    db.commit()
    return objs

def get_permission_map(db: Session, user_id: int) -> dict:
    """Returns {module: {can_view, can_create, ...}} for quick lookup."""
    perms = get_user_permissions(db, user_id)
    return {p.module: p for p in perms}

def has_permission(db: Session, user_id: int, module: str, action: str = "can_view") -> bool:
    perm = db.query(UserPermission).filter(
        UserPermission.user_id == user_id,
        UserPermission.module == module,
    ).first()
    if not perm:
        return False
    return getattr(perm, action, False)
