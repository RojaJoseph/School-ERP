from sqlalchemy import Column, String, Integer, Boolean, DateTime, Enum, ForeignKey, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.session import Base
import enum

class RoleEnum(str, enum.Enum):
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

class User(Base):
    __tablename__ = "users"

    id           = Column(Integer, primary_key=True, index=True)
    full_name    = Column(String(150), nullable=False)
    email        = Column(String(150), unique=True, nullable=False, index=True)
    phone        = Column(String(20), nullable=True)
    password     = Column(String(255), nullable=False)
    role         = Column(Enum(RoleEnum), nullable=False, default=RoleEnum.teacher)
    is_active    = Column(Boolean, default=True)
    is_verified  = Column(Boolean, default=False)
    created_at   = Column(DateTime(timezone=True), server_default=func.now())
    updated_at   = Column(DateTime(timezone=True), onupdate=func.now())

    permissions  = relationship("UserPermission", back_populates="user", cascade="all, delete")


class UserPermission(Base):
    __tablename__ = "user_permissions"

    id       = Column(Integer, primary_key=True, index=True)
    user_id  = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    module   = Column(String(100), nullable=False)
    can_view   = Column(Boolean, default=False)
    can_create = Column(Boolean, default=False)
    can_edit   = Column(Boolean, default=False)
    can_delete = Column(Boolean, default=False)
    can_approve= Column(Boolean, default=False)
    can_export = Column(Boolean, default=False)

    user = relationship("User", back_populates="permissions")
