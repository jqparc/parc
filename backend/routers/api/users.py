from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from db.database import get_db
from services.user_service import UserService
from schemas.user_schema import UserCreate

router = APIRouter()

def get_user_service(db: Session = Depends(get_db)):
    return UserService(db)

# 회원가입 성공 시 201 Created 상태 코드를 반환하도록 설정
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user_data: UserCreate, service: UserService = Depends(get_user_service)):
    # Service 내부에서 조건 불만족 시 자동으로 HTTPException이 발생합니다.
    # 따라서 이곳은 "무조건 성공하는 경우"만 남게 되어 코드가 매우 직관적입니다.
    return service.register_user(user_data)