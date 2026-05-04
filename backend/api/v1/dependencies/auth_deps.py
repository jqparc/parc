from fastapi import Depends, HTTPException, status, Request
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from db.database import get_db
from core.config import settings
from repositories.user_repository import UserRepository
from models.user_model import User

def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    요청(Request)의 쿠키 또는 헤더에서 토큰을 추출하여 현재 로그인한 유저 객체를 반환합니다.
    """
    # 1. 토큰 추출 (API와 프론트엔드 호환을 위해 헤더와 쿠키 모두 확인하는 것이 좋습니다)
    token = request.cookies.get("access_token")
    
    # 쿠키에 없다면 Authorization 헤더(Bearer 토큰)도 확인
    if not token and "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="로그인이 필요합니다."
        )

    try:
        if token.startswith("Bearer "):
            token = token.replace("Bearer ", "")

        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # 🔥 기존 버그 수정: username이 아니라 우리 모델에 맞는 user_id를 사용합니다.
        user_id: str = payload.get("sub") 
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="인증 토큰이 유효하지 않습니다.")
            
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="토큰이 만료되었거나 손상되었습니다.")
        
    # 3. UserRepository를 통해 깔끔하게 DB에서 유저 객체 가져오기
    user_repo = UserRepository(db)
    user = user_repo.get_by_user_id(user_id=user_id)
    
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="사용자를 찾을 수 없습니다.")
        
    return user