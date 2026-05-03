from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from repositories.tab_repository import TabRepository
# from schemas.menu_schema import UserCreate, UserLogin, PasswordChange
from core.security import get_password_hash, verify_password, create_access_token

class TabService:
    def __init__(self, db: Session):
        self.tab_repo = TabRepository(db)

    def get_tabs_for_menu_role(self, menu_id: str, role: str):
        tabs = self.tab_repo.get_list_by_menu_and_role(menu_id, role)
        
        # 2. 조회된 메뉴가 없다면 (빈 리스트 반환 시)
        if not tabs:
            # 3. 공통(COMMON) 메뉴 설정값을 가져옵니다.
            tabs = self.tab_repo.get_list_by_menu_and_role("M00001", "ALL")
            
        return tabs
    # def register_user(self, user_data: UserCreate):
    #     # 1. 중복 체크 - 에러 발생 시 즉시 예외를 던집니다.
    #     if self.user_repo.get_by_user_id(user_data.user_id):
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="이미 존재하는 아이디입니다."
    #         )
            
    #     if self.user_repo.get_by_nickname(user_data.nickname):
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="이미 사용 중인 닉네임입니다."
    #         )
        
    #     # 2. 암호화 및 저장
    #     hashed_pw = get_password_hash(user_data.password)
    #     user_dict = user_data.model_dump()
    #     user_dict["password"] = hashed_pw
        
    #     new_user = self.user_repo.create(user_dict)
        
    #     # 성공했을 때의 순수 데이터만 반환합니다.
    #     return {"success": True, "message": f"{new_user.nickname}님, 회원가입이 완료되었습니다!"}
    
    # def login_user(self, login_data: UserLogin):
    #         # 1. 유저 ID로 데이터베이스에서 사용자 검색
    #         user = self.user_repo.get_by_user_id(login_data.user_id)
            
    #         # 2. 존재하지 않는 아이디인 경우 예외 발생
    #         if not user:
    #             raise HTTPException(
    #                 status_code=status.HTTP_401_UNAUTHORIZED,
    #                 detail="아이디 또는 비밀번호가 올바르지 않습니다."
    #             )

    #         # 3. 비밀번호 일치 여부 검증
    #         if not verify_password(login_data.password, user.password):
    #             raise HTTPException(
    #                 status_code=status.HTTP_401_UNAUTHORIZED,
    #                 detail="아이디 또는 비밀번호가 올바르지 않습니다."
    #             )

    #         # 4. JWT 액세스 토큰 생성 (payload의 'sub'에 user_id 저장)
    #         access_token = create_access_token(data={"sub": user.user_id})

    #         # 5. 프론트엔드가 처리할 수 있도록 성공 응답과 토큰 반환
    #         return {
    #             "success": True,
    #             "message": f"{user.nickname}님, 환영합니다!",
    #             "access_token": access_token,
    #             "token_type": "bearer"
    #         }    
    
    # def update_profile(self, current_user, update_data):
    #     # 1. 닉네임을 변경하려고 하는 경우 중복 체크
    #     if update_data.nickname and update_data.nickname != current_user.nickname:
    #         if self.user_repo.get_by_nickname(update_data.nickname):
    #             raise HTTPException(
    #                 status_code=status.HTTP_400_BAD_REQUEST,
    #                 detail="이미 사용 중인 닉네임입니다."
    #             )

    #     # 2. 변경된 데이터만 추출
    #     update_dict = update_data.model_dump(exclude_unset=True)

    #     # 3. DB 객체에 반영 (SQLAlchemy 세션을 활용한 보편적인 업데이트 방식)
    #     for key, value in update_dict.items():
    #         setattr(current_user, key, value)

    #     self.user_repo.db.commit()
    #     self.user_repo.db.refresh(current_user)

    #     return {"success": True, "message": "정보가 성공적으로 수정되었습니다! ✨"}
    
    # def change_password(self, current_user, pw_data : PasswordChange):
    #     # 1. 현재 비밀번호가 맞는지 확인
    #     if not verify_password(pw_data.current_password, current_user.password):
    #         raise HTTPException(
    #             status_code=status.HTTP_400_BAD_REQUEST,
    #             detail="현재 비밀번호가 일치하지 않습니다."
    #         )
        
    #     # 2. 새 비밀번호 암호화 후 저장
    #     current_user.password = get_password_hash(pw_data.new_password)
    #     self.user_repo.db.commit()
        
    #     return {"success": True, "message": "비밀번호가 성공적으로 변경되었습니다."}