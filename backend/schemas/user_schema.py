from datetime import datetime
from typing import Optional
import re

from pydantic import BaseModel, ConfigDict, Field, field_validator

from models.user_model import UserRole, UserStatus


class UserBase(BaseModel):
    user_id: str = Field(..., min_length=4, max_length=20, description="아이디")
    nickname: str = Field(..., min_length=2, max_length=20, description="닉네임")
    phone: str = Field(..., description="전화번호")


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, description="비밀번호")

    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('비밀번호는 영문자와 숫자를 모두 포함해야 합니다.')
        return v


class UserResponse(UserBase):
    id: int
    provider: str
    social_id: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserLogin(BaseModel):
    user_id: str = Field(..., description="아이디")
    password: str = Field(..., description="비밀번호")


class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=2, max_length=20)
    phone: Optional[str] = None


class PasswordVerify(BaseModel):
    current_password: str


class PasswordChange(BaseModel):
    verification_token: str
    new_password: str = Field(..., min_length=8)

    @field_validator('new_password')
    @classmethod
    def validate_new_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('새 비밀번호는 영문자와 숫자를 모두 포함해야 합니다.')
        return v
