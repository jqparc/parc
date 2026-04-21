# routers/api/users.py
from fastapi import APIRouter, Depends, Request, Response, HTTPException # Depends 추가!
from sqlalchemy.orm import Session
from schemas.user_schema import UserSignup, UserLogin
from services.user_service import create_new_user, authenticate_user
from db.database import get_db # DB 출입증 발급기 가져오기
from jose import jwt, JWTError
from core.security import get_current_user, get_password_hash
from models.user_model import User

router = APIRouter(tags=["User Profile"])

# 회원가입 처리
@router.post("/signup")
def signup(user: UserSignup, db: Session = Depends(get_db)):
    # ⭐ Depends(get_db)가 서버에 요청이 올 때마다 안전하게 DB 문을 열어주고, 끝나면 닫아줍니다.
    
    # 서비스(주방장)에게 데이터와 함께 DB 출입증(db)도 같이 넘겨줍니다!
    result = create_new_user(db, user)
    return result

@router.post("/login")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)): # 파라미터에 response 추가!
    
    # 1. 주방장(서비스)에게 아이디/비번 확인 및 토큰 생성을 부탁합니다.
    result = authenticate_user(db, user)
    
    if result["success"]:
        # 2. 로그인이 성공했다면, 서버가 직접 'access_token'이라는 이름의 쿠키를 굽습니다!
        response.set_cookie(
            key="access_token",                 # 쿠키 이름
            value=result['access_token'],       # 쿠키 내용 (발급받은 토큰)
            httponly=True,                      # ⭐ 핵심! 자바스크립트가 절대 못 건드리게 함 ⭐
            secure=False,                       # 지금은 로컬(http) 개발 중이므로 False. 나중에 실제 배포(https)할 땐 True로!
            samesite="lax",                     # 다른 사이트에서 함부로 쿠키를 못 쓰게 방어 (CSRF 방어)
            max_age=1800                        # 1800초 (30분) 뒤에 쿠키가 사라지게 설정
        )
        # 이제 토큰은 쿠키로 구워졌으니, JSON 결과로는 굳이 토큰을 안 보내줘도 됩니다.
        return {"success": True, "message": result["message"]}
    
    # 로그인 실패 시
    return result

@router.post("/logout")
async def logout(response: Response):
    
    response.delete_cookie(key="access_token")
    return {"success": True, "message": "로그아웃 되었습니다."}

@router.get("/me")
async def get_my_info(current_user: User = Depends(get_current_user)):
    return {
        "loggedIn": True,
        "username": current_user.username
    }

@router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "username": current_user.username,
        # 추가 필드가 있다면 여기에 포함 (예: email, nickname 등)
    }

@router.put("/profile")
async def update_profile(
    new_data: dict, # 간단하게 dict로 받거나 Pydantic Schema 사용
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if "password" in new_data:
        current_user.hashed_password = get_password_hash(new_data["password"])
    
    db.commit()
    return {"message": "정보가 성공적으로 수정되었습니다."}