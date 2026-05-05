# backend/repositories/user_repository.py
from sqlalchemy.orm import Session
from models.menu_model import Menu
from .base_repository import BaseRepository

class MenuRepository(BaseRepository[Menu]):
    def __init__(self, db: Session):
        super().__init__(Menu, db)

    def get_list_by_role(self, role: str) -> list[Menu]:
        return self.db.query(Menu).filter(Menu.role == role).order_by(Menu.seq).all()

    def get_list_by_roles(self, roles: list[str], include_inactive: bool = False) -> list[Menu]:
        query = self.db.query(Menu).filter(Menu.role.in_(roles))
        if not include_inactive:
            query = query.filter(Menu.use_yn == "Y")

        return query.order_by(Menu.seq).all()

    def get_by_menu_id(self, menu_id: str) -> Menu | None:
        return self.db.query(Menu).filter(Menu.menu_id == menu_id).first()
    
    def get_list_by_user_id(self, user_id: str) -> list[Menu]:
        return self.db.query(Menu).filter(Menu.user_id == user_id).order_by(Menu.seq).all()
