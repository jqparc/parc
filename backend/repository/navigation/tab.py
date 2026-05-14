from sqlalchemy.orm import Session

from model.navigation import Tab
from repository.base_repository import BaseRepository


class TabRepository(BaseRepository[Tab]):
    def __init__(self, db: Session):
        super().__init__(Tab, db)

    def get_by_menu_and_tab_id(self, menu_id: str, tab_id: str) -> Tab | None:
        return self.db.query(Tab).filter(Tab.menu_id == menu_id, Tab.tab_id == tab_id).first()

    def get_list_by_menu_and_roles(
        self,
        menu_id: str,
        roles: list[str],
        include_inactive: bool = False,
    ) -> list[Tab]:
        query = self.db.query(Tab).filter(Tab.menu_id == menu_id, Tab.role.in_(roles))
        if not include_inactive:
            query = query.filter(Tab.use_yn == "Y")

        return query.order_by(Tab.seq).all()
