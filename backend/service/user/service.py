from sqlalchemy.orm import Session

from .auth import AuthService
from .mypage import MyPageService


class UserService:
    def __init__(self, db: Session):
        self.auth = AuthService(db)
        self.mypage = MyPageService(db)

    def register_user(self, user_data):
        return self.auth.register_user(user_data)

    def check_availability(self, user_id: str | None = None, nickname: str | None = None):
        return self.auth.check_availability(user_id=user_id, nickname=nickname)

    def login_user(self, login_data):
        return self.auth.login_user(login_data)

    def update_profile(self, current_user, update_data):
        return self.mypage.update_profile(current_user, update_data)

    def verify_password_for_change(self, current_user, verify_data):
        return self.mypage.verify_password(current_user, verify_data)

    def change_password(self, current_user, pw_data):
        return self.mypage.change_password(current_user, pw_data)
