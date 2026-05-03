# backend/repositories/tab_repository.py
from sqlalchemy.orm import Session
from models.tab_model import Tab
from .base_repository import BaseRepository

class TabRepository(BaseRepository[Tab]):
    def __init__(self, db: Session):
        super().__init__(Tab, db)

    def get_by_user_id(self, user_id: str) -> Tab:
        return self.db.query(Tab).filter(Tab.user_id == user_id).first()
    
    def get_list_by_menu_and_role(self, menu_id: str, role: str) -> list[Tab]:
        return self.db.query(Tab).filter(Tab.menu_id == menu_id,
                                         Tab.role == role).order_by(Tab.seq).all()