# backend/services/user_service.py
from sqlalchemy.orm import Session
from core.security import get_password_hash, verify_password, create_access_token
from crud import user_crud 
from schemas.user_schema import UserCreate, UserLogin, UserUpdate, PasswordChangeRequest

def create_new_user(db: Session, user_data: UserCreate):
    # 1. 중복 검사 (CRUD 레이어 활용)
    existing_user = user_crud.get_user_by_user_id(db, user_id=user_data.user_id)
    if existing_user:
        return {"success": False, "message": "이미 존재하는 아이디입니다."}
    
    # ⭐ 2. 닉네임 중복 검사 (새로 추가됨!)
    existing_nickname = user_crud.get_user_by_nickname(db, nickname=user_data.nickname)
    if existing_nickname:
        return {"success": False, "message": "이미 사용 중인 닉네임입니다."}
    
    # 2. 비즈니스 로직: 비밀번호 해싱
    hashed_pwd = get_password_hash(user_data.password)
    
    # 3. DB 저장 (CRUD 레이어 활용)
    new_user = user_crud.create_user(db, user_data=user_data, hashed_password=hashed_pwd)
    
    return {"success": True, "message": f"{new_user.user_id}님, 회원가입이 완료되었습니다!"}

def authenticate_user(db: Session, login_data: UserLogin):
    # 1. 유저 찾기 (CRUD 레이어 활용)
    user = user_crud.get_user_by_user_id(db, user_id=login_data.user_id)
    
    # 2. 비즈니스 로직: 비밀번호 검증
    if not user or not verify_password(login_data.password, user.password):
        return {"success": False, "message": "아이디 또는 비밀번호가 올바르지 않습니다."}
    
    # 3. 비즈니스 로직: 토큰 생성
    access_token = create_access_token(data={"sub": user.user_id})
    
    return {
        "success": True, 
        "message": f"{user.nickname}님, 반가워요!", # 로그인 메시지도 닉네임으로!
        "access_token": access_token, 
        "token_type": "bearer"
    }

def modify_user_profile(db: Session, user_id: str, update_data: UserUpdate):
    # 1. DB에서 유저 찾기
    user = user_crud.get_user_by_user_id(db, user_id=user_id)
    if not user:
        return {"success": False, "message": "사용자를 찾을 수 없습니다."}
    
    # 2. 클라이언트가 보낸 데이터만 딕셔너리로 변환 (안 보낸 건 무시)
    update_dict = update_data.model_dump(exclude_unset=True)
    
    # 3. 닉네임을 변경하려고 한다면 중복 검사
    if "nickname" in update_dict and update_dict["nickname"] != user.nickname:
        existing_nickname = user_crud.get_user_by_nickname(db, nickname=update_dict["nickname"])
        if existing_nickname:
            return {"success": False, "message": "이미 사용 중인 닉네임입니다."}
        
    # 5. DB 업데이트 실행 (Step 1에서 만든 crud 함수 사용)
    user_crud.update_user_info(db, db_user=user, update_data=update_dict)
    
    return {"success": True, "message": "개인정보가 성공적으로 수정되었습니다."}

def change_user_password(db: Session, user_id: str, pw_data: PasswordChangeRequest):
    # 1. DB에서 유저 정보 가져오기
    user = user_crud.get_user_by_user_id(db, user_id=user_id)
    if not user:
        return {"success": False, "message": "사용자를 찾을 수 없습니다."}
    
    # 2. 현재 비밀번호가 맞는지 검증
    # core.security에 있는 verify_password 함수를 사용합니다.
    if not verify_password(pw_data.current_password, user.password):
        return {"success": False, "message": "현재 비밀번호가 일치하지 않습니다."}
    
    # 3. 새 비밀번호 암호화(해싱)
    hashed_new_password = get_password_hash(pw_data.new_password)
    
    # 4. DB 업데이트 (기존 update_user_info 재사용 가능)
    user_crud.update_user_info(db, db_user=user, update_data={"password": hashed_new_password})
    
    return {"success": True, "message": "비밀번호가 안전하게 변경되었습니다."}