from datetime import datetime, timedelta

from fastapi import HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.security import create_access_token, get_password_hash, verify_password
from repositories.user_repository import UserRepository
from schemas.user_schema import PasswordChange, PasswordVerify, UserCreate, UserLogin


class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_data: UserCreate):
        if self.user_repo.get_by_user_id(user_data.user_id):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 존재하는 아이디입니다.",
            )

        if self.user_repo.get_by_nickname(user_data.nickname):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="이미 사용 중인 닉네임입니다.",
            )

        user_dict = user_data.model_dump()
        user_dict["password"] = get_password_hash(user_data.password)
        new_user = self.user_repo.create(user_dict)
        return {"success": True, "message": f"{new_user.nickname}님, 회원가입이 완료되었습니다."}

    def check_availability(self, user_id: str | None = None, nickname: str | None = None):
        result = {}
        if user_id is not None:
            result["user_id"] = {
                "value": user_id,
                "available": self.user_repo.get_by_user_id(user_id) is None,
            }

        if nickname is not None:
            result["nickname"] = {
                "value": nickname,
                "available": self.user_repo.get_by_nickname(nickname) is None,
            }

        return result

    def login_user(self, login_data: UserLogin):
        user = self.user_repo.get_by_user_id(login_data.user_id)
        if not user or not verify_password(login_data.password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="아이디 또는 비밀번호가 올바르지 않습니다.",
            )

        access_token = create_access_token(data={"sub": user.user_id})
        return {
            "success": True,
            "message": f"{user.nickname}님, 환영합니다.",
            "access_token": access_token,
            "token_type": "bearer",
        }

    def update_profile(self, current_user, update_data):
        if update_data.nickname and update_data.nickname != current_user.nickname:
            if self.user_repo.get_by_nickname(update_data.nickname):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="이미 사용 중인 닉네임입니다.",
                )

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(current_user, key, value)

        self.user_repo.db.commit()
        self.user_repo.db.refresh(current_user)
        return {"success": True, "message": "정보가 성공적으로 수정되었습니다."}

    def verify_password_for_change(self, current_user, verify_data: PasswordVerify):
        if not verify_password(verify_data.current_password, current_user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="현재 비밀번호가 일치하지 않습니다.",
            )

        payload = {
            "sub": current_user.user_id,
            "purpose": "password_change",
            "exp": datetime.utcnow() + timedelta(minutes=5),
        }
        token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        return {"verified": True, "verification_token": token}

    def change_password(self, current_user, pw_data: PasswordChange):
        try:
            payload = jwt.decode(
                pw_data.verification_token,
                settings.SECRET_KEY,
                algorithms=[settings.ALGORITHM],
            )
        except JWTError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호 확인 시간이 만료되었습니다. 다시 확인해 주세요.",
            ) from exc

        if (
            payload.get("sub") != current_user.user_id
            or payload.get("purpose") != "password_change"
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="비밀번호 확인 정보가 올바르지 않습니다.",
            )

        current_user.password = get_password_hash(pw_data.new_password)
        self.user_repo.db.commit()
        return {"success": True, "message": "비밀번호가 성공적으로 변경되었습니다."}
