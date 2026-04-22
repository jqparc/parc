# backend/routers/api/users.py
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session
from schemas.user_schema import UserCreate, UserLogin, UserUpdate, UserResponse, PasswordChangeRequest
from services.user_service import create_new_user, authenticate_user, modify_user_profile, change_user_password
from db.database import get_db
from jose import jwt, JWTError
from core.security import SECRET_KEY, ALGORITHM
from crud import user_crud

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
async def get_my_info(request: Request, db: Session = Depends(get_db)):
    # 1. 쿠키에서 토큰 꺼내기
    token = request.cookies.get("access_token")
    
    if not token:
        return {"loggedIn": False}

    try:
        # 2. 토큰 껍데기("Bearer ") 벗기고 해독하기
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub") 
        user = user_crud.get_user_by_user_id(db, user_id=user_id)
        
        if not user:
            return {"loggedIn": False}
        
        user_info = UserResponse.model_validate(user).model_dump()        
            
        return {
                "loggedIn": True, 
                **user_info
            }
        
    except JWTError:
        return {"loggedIn": False}
    
@router.put("/me")
async def update_my_info(update_data: UserUpdate, request: Request, db: Session = Depends(get_db)):
    # 1. 쿠키에서 토큰 꺼내서 본인 확인
    token = request.cookies.get("access_token")
    if not token:
        return {"success": False, "message": "로그인이 필요합니다."}

    try:
        # 2. 토큰 해독하여 user_id 추출
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        if not user_id:
            return {"success": False, "message": "유효하지 않은 토큰입니다."}
            
        # 3. 서비스 로직에 정보 수정 요청
        result = modify_user_profile(db, user_id=user_id, update_data=update_data)
        return result
        
    except JWTError:
        return {"success": False, "message": "인증이 만료되었거나 잘못되었습니다."}    
    
@router.put("/me/password")
async def update_password(
    pw_data: PasswordChangeRequest, 
    request: Request, 
    db: Session = Depends(get_db)
):
    token = request.cookies.get("access_token")
    if not token:
        return {"success": False, "message": "로그인이 필요합니다."}

    try:
        token = token.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        
        # 서비스 로직 호출
        result = change_user_password(db, user_id=user_id, pw_data=pw_data)
        return result
        
    except JWTError:
        return {"success": False, "message": "인증이 만료되었습니다."}