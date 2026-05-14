from sqlalchemy.orm import Session

from model.navigation import Menu
from repository.base_repository import BaseRepository


class MenuRepository(BaseRepository[Menu]):
    def __init__(self, db: Session):
        super().__init__(Menu, db)

    def get_list_by_roles(self, roles: list[str], include_inactive: bool = False) -> list[Menu]:
        query = self.db.query(Menu).filter(Menu.role.in_(roles))
        if not include_inactive:
            query = query.filter(Menu.use_yn == "Y")

        return query.order_by(Menu.seq).all()

    def get_by_menu_id(self, menu_id: str) -> Menu | None:
        return self.db.query(Menu).filter(Menu.menu_id == menu_id).first()
