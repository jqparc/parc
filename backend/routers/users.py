# routers/users.py
from fastapi import APIRouter, Depends # Depends 추가!
from sqlalchemy.orm import Session
from schemas.user_schema import UserSignup
from services.user_service import create_new_user
from db.database import get_db # DB 출입증 발급기 가져오기

router = APIRouter()

# 회원가입 처리
@router.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    # ⭐ Depends(get_db)가 서버에 요청이 올 때마다 안전하게 DB 문을 열어주고, 끝나면 닫아줍니다.
    
    # 서비스(주방장)에게 데이터와 함께 DB 출입증(db)도 같이 넘겨줍니다!
    result = create_new_user(db, user)
    return result