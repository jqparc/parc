from sqlalchemy.orm import Session

from repositories.tab_repository import TabRepository
from schemas.tab_schema import TabCreate, TabUpdate


class TabService:
    def __init__(self, db: Session):
        self.tab_repo = TabRepository(db)

    def get_tabs_for_menu_role(self, menu_id: str, role: str, include_inactive: bool = False):
        roles = ["ALL"]
        if role == "ADMIN" and include_inactive:
            roles = ["ALL", "USER", "MANAGER", "ADMIN"]
        elif role and role != "ALL":
            roles.append(role)

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
