# backend/schemas/user_schema.py
from pydantic import BaseModel, ConfigDict, Field, field_validator
from typing import Optional
from datetime import datetime
import re

class TabBase(BaseModel):
    # Field를 사용하여 최소/최대 길이 지정 (DB 에러 방지 및 보안)
    id: str = Field(..., description="id")
    menu_id: str = Field(..., description="menu_id")
    tab_id: str = Field(..., description="menu_id")
    tab_name: str = Field(..., description="menu_name")
    href: str = Field(..., description="href")
    role: str = Field(..., description="role")
    use_yn: str = Field(..., description="use_yn")
    seq: str = Field(..., description="seq")

# 3. 로그인/조회 시 서버가 클라이언트에게 응답하는 데이터 (비밀번호 제외, 보안 유지)
class TabResponse(TabBase):
    id: int
    menu_id: str
    tab_id: str
    tab_name: str
    href: str
    role: str
    use_yn: Optional[str] = None
    seq: Optional[int] = None

    # Pydantic v2 설정 (SQLAlchemy 모델을 Pydantic 모델로 변환 허용)
    model_config = ConfigDict(from_attributes=True)

# class UserUpdate(BaseModel):
#     id: int
#     user_id: str
#     menu_id: str
#     menu_name: str
#     use_yn: Optional[str] = None
#     seq: Optional[str] = None
#     nickname: Optional[str] = Field(None, min_length=2, max_length=20)
#     phone: Optional[str] = None

# class PasswordChange(BaseModel):
#     current_password: str  # 현재 비밀번호 (본인 확인용)
#     new_password: str = Field(..., min_length=8)      # 새 비밀번호
    
#     # 새 비밀번호 변경 시에도 복잡도 검증을 적용할 수 있습니다.
#     @field_validator('new_password')
#     @classmethod
#     def validate_new_password_complexity(cls, v: str) -> str:
#         if not re.search(r'[A-Za-z]', v) or not re.search(r'[0-9]', v):
#             raise ValueError('새 비밀번호는 영문자와 숫자를 모두 포함해야 합니다.')
#         return v