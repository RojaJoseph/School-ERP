from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

# Add refresh_token to TokenResponse
from app.schemas.user import UserResponse

class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: Optional[str] = None
    token_type:    str = "bearer"
    user:          UserResponse

    class Config:
        from_attributes = True
