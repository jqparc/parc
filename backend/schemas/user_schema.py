# schemas/user_schema.py
from pydantic import BaseModel, Field

class UserSignup(BaseModel):
    # Field를 사용하면 제약 조건을 걸 수 있습니다.
    username: str = Field(..., min_length=3, description="아이디는 3글자 이상이어야 합니다.")
    password: str = Field(..., min_length=4, description="비밀번호는 4글자 이상이어야 합니다.")

class UserLogin(BaseModel):
    username: str = Field(..., description="아이디")
    password: str = Field(..., description="비밀번호")    