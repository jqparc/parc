from sqlalchemy.orm import Session

from repository.system.navigation import TabRepository
from schema.system.navigation import TabCreate, TabUpdate
from .role import get_visible_roles


class TabService:
    def __init__(self, db: Session):
        self.tab_repo = TabRepository(db)

    def get_tabs_for_menu_role(self, menu_id: str, role: str, include_inactive: bool = False):
        roles = get_visible_roles(role, include_inactive)
        return self.tab_repo.get_list_by_menu_and_roles(menu_id, roles, include_inactive)

    def create_tab(self, tab_data: TabCreate):
        return self.tab_repo.create(tab_data.model_dump())

    def update_tab(self, menu_id: str, tab_id: str, tab_data: TabUpdate):
        tab = self.tab_repo.get_by_menu_and_tab_id(menu_id, tab_id)
        if not tab:
            return None

        for key, value in tab_data.model_dump(exclude_unset=True).items():
            setattr(tab, key, value)

        self.tab_repo.db.commit()
        self.tab_repo.db.refresh(tab)
        return tab
