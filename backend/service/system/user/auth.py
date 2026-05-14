from sqlalchemy.orm import Session

from core.exception import bad_request, unauthorized
from core.security import create_access_token, get_password_hash, verify_password
from repository.system.user import UserRepository
from schema.system.user import UserCreate, UserLogin


class AuthService:
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
