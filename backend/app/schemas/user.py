from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    super_admin   = "super_admin"
    school_admin  = "school_admin"
    sub_admin     = "sub_admin"
    teacher       = "teacher"
    accountant    = "accountant"
    hr_manager    = "hr_manager"
    librarian     = "librarian"
    transport_mgr = "transport_mgr"
    student       = "student"
    parent        = "parent"

class PermissionSchema(BaseModel):
    module:     str
    can_view:   bool = False
    can_create: bool = False
    can_edit:   bool = False
    can_delete: bool = False
    can_approve:bool = False
    can_export: bool = False

class UserCreate(BaseModel):
    full_name: str
    email:     str
    phone:     Optional[str] = None
    password:  str
    role:      RoleEnum

class UserUpdate(BaseModel):
    full_name:  Optional[str] = None
    phone:      Optional[str] = None
    role:       Optional[RoleEnum] = None
    is_active:  Optional[bool] = None

class UserResponse(BaseModel):
    id:          int
    full_name:   str
    email:       str
    phone:       Optional[str]
    role:        RoleEnum
    is_active:   bool
    created_at:  datetime
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email:    str
    password: str

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: Optional[str] = None
    token_type:    str = "bearer"
    user:          UserResponse

class ChangePassword(BaseModel):
    old_password: str
    new_password: str
