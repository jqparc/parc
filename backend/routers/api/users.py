# backend/routers/api/users.py
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from schemas.user_schema import UserCreate, UserLogin, UserUpdate, UserResponse, PasswordChangeRequest
from services.user_service import create_new_user, authenticate_user, modify_user_profile, change_user_password
from db.database import get_db
from jose import jwt, JWTError
from core.security import get_current_user
from models.user_model import User

router = APIRouter()

# 회원가입 처리
@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 프론트엔드에서 넘어온 user_id, password, phone(선택)이 UserCreate 스키마를 통과해 들어옵니다.
    result = create_new_user(db, user)
    return result

@router.post("/login")
def login(user: UserLogin, response: Response, db: Session = Depends(get_db)):
    # 서비스에 로그인 로직(DB 확인 및 토큰 발급)을 요청합니다.
    result = authenticate_user(db, user)
    
    if result.get("success"):
        # 로그인이 성공했다면 쿠키를 굽습니다.
        response.set_cookie(
            key="access_token",                 
            value=f"Bearer {result['access_token']}", 
            httponly=True,                      # 자바스크립트 접근 방지 (보안)
            secure=False,                       # 배포(https) 시에는 True로 변경!
            samesite="lax",                     
            max_age=1800                        # 30분 만료
        )
        return {"success": True, "message": result["message"]}
    
    # 실패 시 에러 메시지 반환
    return result

@router.post("/logout")
async def logout(response: Response):
    # 쿠키를 삭제하여 로그아웃 처리
    response.delete_cookie(key="access_token")
    return {"success": True, "message": "로그아웃 되었습니다."}

@router.get("/me")
async def get_my_info(current_user: User = Depends(get_current_user)):
    # get_current_user가 실패하면 자동으로 401 에러를 프론트엔드로 보냅니다.
    user_info = UserResponse.model_validate(current_user).model_dump()        
    return {
        "loggedIn": True, 
        **user_info
    }
    
@router.put("/me")
async def update_my_info(
    update_data: UserUpdate, 
    current_user: User = Depends(get_current_user), # 토큰 검증 및 유저 정보 자동 로드
    db: Session = Depends(get_db)
):
    # 이제 해독할 필요 없이 바로 서비스 로직 호출
    result = modify_user_profile(db, user_id=current_user.user_id, update_data=update_data)
    return result   
    
@router.put("/me/password")
async def update_password(
    pw_data: PasswordChangeRequest, 
    current_user: User = Depends(get_current_user), # 토큰 검증 및 유저 정보 자동 로드
    db: Session = Depends(get_db)
):
    result = change_user_password(db, user_id=current_user.user_id, pw_data=pw_data)
    return result