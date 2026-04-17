# services/user_service.py
from sqlalchemy.orm import Session
from schemas.user_schema import UserSignup, UserLogin
from models.user_model import User
from core.security import get_password_hash, verify_password
from core.security import create_access_token

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

def authenticate_user(db: Session, login_data: UserLogin):
    # 1. DB에서 아이디가 똑같은 유저가 있는지 찾아봅니다.
    user = db.query(User).filter(User.username == login_data.username).first()
    
    # 2. 유저가 없거나, 비밀번호가 틀렸다면? (보안을 위해 둘 다 똑같은 에러 메시지를 줍니다)
    # verify_password 함수가 알아서 평문 비번과 다져진 비번을 비교해 줘요!
    if not user or not verify_password(login_data.password, user.password):
        return {"success": False, "message": "아이디 또는 비밀번호가 올바르지 않습니다."}
    
    # 3. 로그인 성공! (나중에는 여기에 로그인 인증 스티커(토큰)를 발급하는 과정이 추가될 거예요)
    return {"success": True, "message": f"환영합니다, {user.username}님!"}

def authenticate_user(db: Session, login_data: UserLogin):
    user = db.query(User).filter(User.username == login_data.username).first()
    if not user or not verify_password(login_data.password, user.password):
        return {"success": False, "message": "실패"}
    
    # 👇 로그인 성공 시 토큰(팔찌) 생성
    access_token = create_access_token(data={"sub": user.username})
    return {
        "success": True, 
        "message": "로그인 성공!",
        "access_token": access_token, # 클라이언트에게 전달
        "token_type": "bearer"
    }