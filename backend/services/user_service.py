from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from repositories.user_repository import UserRepository
from schemas.user_schema import UserCreate, UserLogin
from core.security import get_password_hash, verify_password, create_access_token

class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_data: UserCreate):
        # 1. 중복 체크 - 에러 발생 시 즉시 예외를 던집니다.
        if self.user_repo.get_by_user_id(user_data.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 존재하는 아이디입니다."
            )
            
        if self.user_repo.get_by_nickname(user_data.nickname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 닉네임입니다."
            )
        
        # 2. 암호화 및 저장
        hashed_pw = get_password_hash(user_data.password)
        user_dict = user_data.model_dump()
        user_dict["password"] = hashed_pw
        
        new_user = self.user_repo.create(user_dict)
        
        # 성공했을 때의 순수 데이터만 반환합니다.
        return {"success": True, "message": f"{new_user.nickname}님, 회원가입이 완료되었습니다!"}
    
    def login_user(self, login_data: UserLogin):
            # 1. 유저 ID로 데이터베이스에서 사용자 검색
            user = self.user_repo.get_by_user_id(login_data.user_id)
            
            # 2. 존재하지 않는 아이디인 경우 예외 발생
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="아이디 또는 비밀번호가 올바르지 않습니다."
                )

            # 3. 비밀번호 일치 여부 검증
            if not verify_password(login_data.password, user.password):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="아이디 또는 비밀번호가 올바르지 않습니다."
                )

            # 4. JWT 액세스 토큰 생성 (payload의 'sub'에 user_id 저장)
            access_token = create_access_token(data={"sub": user.user_id})

            # 5. 프론트엔드가 처리할 수 있도록 성공 응답과 토큰 반환
            return {
                "success": True,
                "message": f"{user.nickname}님, 환영합니다!",
                "access_token": access_token,
                "token_type": "bearer"
            }    