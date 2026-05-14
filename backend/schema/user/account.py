from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from model.user import UserRole, UserStatus


class UserBase(BaseModel):
    user_id: str = Field(..., min_length=4, max_length=20, description="User ID")
    nickname: str = Field(..., min_length=2, max_length=20, description="Nickname")
    phone: str = Field(..., description="Phone number")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="Password")

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"[0-9]", value):
            raise ValueError("Password must contain both letters and numbers.")
        return value


class UserResponse(UserBase):
    id: int
    provider: str
    social_id: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    user_id: str = Field(..., min_length=4, max_length=20, description="User ID")
    password: str = Field(..., min_length=8, description="Password")


class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=2, max_length=20)
    phone: Optional[str] = None
    verification_token: Optional[str] = None


class PasswordVerify(BaseModel):
    current_password: str


class PasswordChange(BaseModel):
    verification_token: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def validate_new_password_complexity(cls, value: str) -> str:
        if not re.search(r"[A-Za-z]", value) or not re.search(r"[0-9]", value):
            raise ValueError("Password must contain both letters and numbers.")
        return value
