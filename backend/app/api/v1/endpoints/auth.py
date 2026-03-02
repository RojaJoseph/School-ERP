from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User, UserPermission, RoleEnum
from app.schemas.user import UserCreate, UserUpdate, UserResponse, LoginRequest, TokenResponse, PermissionSchema, ChangePassword
from app.core.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_refresh_token
from app.core.dependencies import get_current_user, require_roles
from pydantic import BaseModel
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Auth & Users"])


# ── Register ─────────────────────────────────────────
@router.post("/register", response_model=UserResponse, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        full_name=data.full_name,
        email=data.email,
        phone=data.phone,
        password=hash_password(data.password),
        role=data.role,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New user registered: {user.email} [{user.role}]")
    return user


# ── Login ────────────────────────────────────────────
@router.post("/login", response_model=TokenResponse)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact administrator.")
    access_token  = create_access_token({"sub": str(user.id), "role": user.role})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    logger.info(f"User logged in: {user.email}")
    # Include permissions in response
    from app.crud.crud_user import get_user_permissions
    perms = get_user_permissions(db, user.id)
    user.permissions = perms
    return {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "token_type":    "bearer",
        "user":          user,
    }


# ── Refresh Token ─────────────────────────────────────
class RefreshRequest(BaseModel):
    refresh_token: str

@router.post("/refresh")
def refresh_token(data: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_refresh_token(data.refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    access_token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": access_token, "token_type": "bearer"}


# ── Get Current User ──────────────────────────────────
@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ── Change Password ───────────────────────────────────
@router.post("/change-password")
def change_password(
    data: ChangePassword,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.old_password, current_user.password):
        raise HTTPException(status_code=400, detail="Old password is incorrect")
    if len(data.new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
    current_user.password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


# ── Update Own Profile ──────────────────────────────────
@router.put("/me", response_model=UserResponse)
def update_me(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Allow any authenticated user to update their own profile."""
    for k, v in data.model_dump(exclude_unset=True).items():
        # Users cannot change their own role
        if k in ("role", "is_active"): continue
        setattr(current_user, k, v)
    db.commit()
    db.refresh(current_user)
    return current_user


# ── List Users ────────────────────────────────────────
@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.super_admin, RoleEnum.school_admin)),
):
    return db.query(User).order_by(User.created_at.desc()).all()


# ── Update User ───────────────────────────────────────
@router.put("/users/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.super_admin, RoleEnum.school_admin)),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)
    return user


# ── Assign Permissions ────────────────────────────────
@router.post("/users/{user_id}/permissions")
def assign_permissions(
    user_id: int,
    permissions: List[PermissionSchema],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.super_admin, RoleEnum.school_admin)),
):
    db.query(UserPermission).filter(UserPermission.user_id == user_id).delete()
    for p in permissions:
        perm = UserPermission(user_id=user_id, **p.model_dump())
        db.add(perm)
    db.commit()
    return {"message": "Permissions updated successfully"}


# ── Delete User ───────────────────────────────────────
@router.delete("/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(RoleEnum.super_admin)),
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
