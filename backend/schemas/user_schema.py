# backend/schemas/user_schema.py
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
import re
from models.user_model import UserRole, UserStatus

class UserBase(BaseModel):
    # Field를 사용하여 최소/최대 길이 지정 (DB 에러 방지 및 보안)
    user_id: str = Field(..., min_length=4, max_length=20, description="아이디 (4~20자)")
    nickname: str = Field(..., min_length=2, max_length=20, description="닉네임 (2~20자)")
    phone: str = Field(..., description="전화번호")

class UserCreate(UserBase):
    # 비밀번호 최소 길이를 8자로 제한
    password: str = Field(..., min_length=8, description="비밀번호 (최소 8자 이상)")

    # 💡 Pydantic v2 비밀번호 복잡도 검증 로직 추가
    @field_validator('password')
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        # 영문자와 숫자가 각각 1개 이상 포함되어 있는지 정규식으로 검사
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('비밀번호는 영문자와 숫자를 모두 포함해야 합니다.')
        
        # 특수문자도 강제하고 싶다면 아래 주석을 해제하세요.
        # if not re.search(r'[\W_]', v):
        #     raise ValueError('비밀번호는 최소 1개의 특수문자를 포함해야 합니다.')
            
        return v

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

class UserUpdate(BaseModel):
    nickname: Optional[str] = Field(None, min_length=2, max_length=20)
    phone: Optional[str] = None

class PasswordChange(BaseModel):
    current_password: str  # 현재 비밀번호 (본인 확인용)
    new_password: str = Field(..., min_length=8)      # 새 비밀번호
    
    # 새 비밀번호 변경 시에도 복잡도 검증을 적용할 수 있습니다.
    @field_validator('new_password')
    @classmethod
    def validate_new_password_complexity(cls, v: str) -> str:
        if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
            raise ValueError('새 비밀번호는 영문자와 숫자를 모두 포함해야 합니다.')
        return v