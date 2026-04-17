# services/user_service.py
from sqlalchemy.orm import Session
from schemas.user_schema import UserSignup
from models.user_model import User
from core.security import get_password_hash 

def create_new_user(db: Session, user_data: UserSignup):
    # 1. 중복 아이디 검사
    existing_user = db.query(User).filter(User.username == user_data.username).first()
    if existing_user:
        return {"success": False, "message": "이미 존재하는 아이디입니다."}
    
    # ⭐ 2. 비밀번호 해싱 (다지기!)
    # 사용자가 입력한 비밀번호를 안전한 해시 문자로 바꿉니다.
    hashed_pwd = get_password_hash(user_data.password)
    
    # 3. 새로운 유저 정보 생성 (평문 password 대신 hashed_pwd를 넣습니다)
    new_user = User(
        username=user_data.username,
        password=hashed_pwd  # 해싱된 비밀번호 저장!
    )
    
    # 4. DB에 밀어 넣기
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"success": True, "message": f"{user_data.username}님, 회원가입이 완료되었습니다!"}