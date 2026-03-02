from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.security import decode_token
from app.db.base import get_db
from app.models.user import User, RoleEnum

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
    return user

def require_roles(*roles: RoleEnum):
    def checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles and current_user.role != RoleEnum.super_admin:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
        return current_user
    return checker

def require_permission(module: str, action: str):
    def checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        if current_user.role == RoleEnum.super_admin:
            return current_user
        perm = next((p for p in current_user.permissions if p.module == module), None)
        if not perm or not getattr(perm, f"can_{action}", False):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=f"No '{action}' permission on '{module}'")
        return current_user
    return checker
