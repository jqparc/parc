from sqlalchemy.orm import Session

from core.exception import bad_request
from core.security import get_password_hash, verify_password
from model.user import User
from repository.user import UserRepository
from schema.user import PasswordChange, PasswordVerify, UserUpdate
from .verification import VerificationTokenService


class MyPageService:
    def __init__(self, db: Session):
        self.user_repo = UserRepository(db)
        self.verification_tokens = VerificationTokenService()

    def update_profile(self, current_user: User, update_data: UserUpdate):
        if update_data.nickname and update_data.nickname != current_user.nickname:
            if self.user_repo.get_by_nickname(update_data.nickname):
                raise bad_request("Nickname is already in use.")

        update_dict = update_data.model_dump(exclude_unset=True)
        update_dict.pop("verification_token", None)
        for key, value in update_dict.items():
            setattr(current_user, key, value)

        self.user_repo.db.commit()
        self.user_repo.db.refresh(current_user)
        return current_user

    def verify_password(self, current_user: User, verify_data: PasswordVerify):
        if not verify_password(verify_data.current_password, current_user.password):
            raise bad_request("Current password does not match.")

        return {
            "verified": True,
            "verification_token": self.verification_tokens.issue_mypage_token(current_user),
        }

    def change_password(self, current_user: User, pw_data: PasswordChange):
        self.verification_tokens.verify_mypage_token(pw_data.verification_token, current_user)
        current_user.password = get_password_hash(pw_data.new_password)
        self.user_repo.db.commit()
        return {"success": True, "message": "Password changed successfully."}
