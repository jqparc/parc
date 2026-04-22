# backend/schemas/user_schema.py
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from models.user_model import UserRole, UserStatus

# 1. 공통 속성 (읽기/쓰기 모두 사용)
class UserBase(BaseModel):
    user_id: str
    nickname: str
    phone: str

# 2. 회원가입 시 클라이언트가 보내야 하는 데이터 (비밀번호 포함)
class UserCreate(UserBase):
    password: str

# 3. 로그인/조회 시 서버가 클라이언트에게 응답하는 데이터 (비밀번호 제외, 보안 유지)
class UserResponse(UserBase):
    id: int
    provider: str
    social_id: Optional[str] = None
    role: UserRole
    status: UserStatus
    created_at: datetime

    # Pydantic v2 설정 (SQLAlchemy 모델을 Pydantic 모델로 변환 허용)
    model_config = ConfigDict(from_attributes=True)

class UserLogin(BaseModel):
    user_id: str = Field(..., description="아이디")
    password: str = Field(..., description="비밀번호")    