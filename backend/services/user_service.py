from datetime import datetime, timedelta

from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.exceptions import bad_request, unauthorized
from core.security import create_access_token, get_password_hash, verify_password
from repositories.user_repository import UserRepository
from schemas.user_schema import PasswordChange, PasswordVerify, UserCreate, UserLogin


class UserService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)

    def register_user(self, user_data: UserCreate):
        if self.user_repo.get_by_user_id(user_data.user_id):
            raise bad_request("User ID is already in use.")

        if self.user_repo.get_by_nickname(user_data.nickname):
            raise bad_request("Nickname is already in use.")

        user_dict = user_data.model_dump()
        user_dict["password"] = get_password_hash(user_data.password)
        new_user = self.user_repo.create(user_dict)
        return {"success": True, "message": f"{new_user.nickname} registration completed."}

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
            raise unauthorized("User ID or password is incorrect.")

        access_token = create_access_token(data={"sub": user.user_id})
        return {
            "success": True,
            "message": f"Welcome, {user.nickname}.",
            "access_token": access_token,
            "token_type": "bearer",
        }

    def update_profile(self, current_user, update_data):
        if update_data.nickname and update_data.nickname != current_user.nickname:
            if self.user_repo.get_by_nickname(update_data.nickname):
                raise bad_request("Nickname is already in use.")

        update_dict = update_data.model_dump(exclude_unset=True)
        for key, value in update_dict.items():
            setattr(current_user, key, value)

        self.user_repo.db.commit()
        self.user_repo.db.refresh(current_user)
        return {"success": True, "message": "Profile updated successfully."}

    def verify_password_for_change(self, current_user, verify_data: PasswordVerify):
        if not verify_password(verify_data.current_password, current_user.password):
            raise bad_request("Current password does not match.")

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
            raise bad_request("Password verification has expired. Please verify again.") from exc

        if (
            payload.get("sub") != current_user.user_id
            or payload.get("purpose") != "password_change"
        ):
            raise bad_request("Password verification token is invalid.")

        current_user.password = get_password_hash(pw_data.new_password)
        self.user_repo.db.commit()
        return {"success": True, "message": "Password changed successfully."}
