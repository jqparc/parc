# backend/repositories/user_repository.py
from sqlalchemy.orm import Session
from models.user_model import User
from .base_repository import BaseRepository

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_user_id(self, user_id: str) -> User:
        return self.db.query(User).filter(User.user_id == user_id).first()

    def get_by_nickname(self, nickname: str) -> User:
        return self.db.query(User).filter(User.nickname == nickname).first()