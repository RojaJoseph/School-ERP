from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.base import get_db
from app.schemas.user import UserCreate, UserUpdate, UserResponse, PermissionSchema
from app.crud.crud_user import (
    get_users, get_user, create_user, update_user,
    get_user_permissions, save_user_permissions, ALL_MODULES
)
from app.core.dependencies import get_current_user, require_roles
from app.models.user import User, RoleEnum

router = APIRouter(prefix="/permissions", tags=["Permissions"])

# ── All modules list ─────────────────────────────────
@router.get("/modules")
def list_modules():
    """Returns all available modules that can be toggled."""
    return {"modules": ALL_MODULES}

# ── Get all users with their permissions ─────────────
@router.get("/users", response_model=List[UserResponse])
def list_users_with_permissions(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    users = get_users(db, role)
    # Exclude super_admin from list (can't restrict them)
    return [u for u in users if u.role != RoleEnum.super_admin]

# ── Get permissions for a specific user ──────────────
@router.get("/users/{user_id}")
def get_permissions(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    perms = get_user_permissions(db, user_id)
    perm_map = {p.module: p for p in perms}
    # Return all modules with their current permission state
    result = []
    for module in ALL_MODULES:
        p = perm_map.get(module)
        result.append({
            "module":     module,
            "can_view":   p.can_view   if p else False,
            "can_create": p.can_create if p else False,
            "can_edit":   p.can_edit   if p else False,
            "can_delete": p.can_delete if p else False,
            "can_approve":p.can_approve if p else False,
            "can_export": p.can_export if p else False,
        })
    return {
        "user": {
            "id": user.id, "full_name": user.full_name,
            "email": user.email, "role": user.role,
            "phone": user.phone,
        },
        "permissions": result
    }

# ── Save permissions for a user ───────────────────────
@router.post("/users/{user_id}")
def save_permissions(
    user_id: int,
    permissions: List[PermissionSchema],
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    # Sub-admin cannot assign permissions to other admins
    if current_user.role == RoleEnum.sub_admin and user.role in (
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    ):
        raise HTTPException(403, "Sub-admin cannot modify admin permissions")
    save_user_permissions(db, user_id, permissions)
    return {"message": f"Permissions saved for {user.full_name}"}

# ── Create new user (sub_admin can create teachers etc) ──
@router.post("/users/create", response_model=UserResponse, status_code=201)
def create_new_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    from app.models.user import User as UserModel
    if db.query(UserModel).filter(UserModel.email == data.email).first():
        raise HTTPException(400, "Email already exists")
    # Sub-admin can only create teacher/librarian/transport roles
    restricted = [RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin]
    if current_user.role == RoleEnum.sub_admin and data.role in restricted:
        raise HTTPException(403, "Sub-admin cannot create admin accounts")
    return create_user(db, data)

# ── Toggle user active/inactive ───────────────────────
@router.patch("/users/{user_id}/toggle")
def toggle_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(
        RoleEnum.super_admin, RoleEnum.school_admin, RoleEnum.sub_admin
    )),
):
    user = get_user(db, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user_id == current_user.id:
        raise HTTPException(400, "Cannot deactivate yourself")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}", "is_active": user.is_active}
