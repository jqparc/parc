from sqlalchemy.orm import Session

from repositories.menu_repository import MenuRepository
from schemas.menu_schema import MenuCreate, MenuUpdate


class MenuService:
    def __init__(self, db: Session):
        self.menu_repo = MenuRepository(db)

    def get_menus_for_role(self, role: str, include_inactive: bool = False):
        roles = ["ALL"]
        if role == "ADMIN" and include_inactive:
            roles = ["ALL", "USER", "MANAGER", "ADMIN"]
        elif role and role != "ALL":
            roles.append(role)

        return self.menu_repo.get_list_by_roles(roles, include_inactive)

    def create_menu(self, menu_data: MenuCreate):
        return self.menu_repo.create(menu_data.model_dump())

    def update_menu(self, menu_id: str, menu_data: MenuUpdate):
        menu = self.menu_repo.get_by_menu_id(menu_id)
        if not menu:
            return None

        for key, value in menu_data.model_dump(exclude_unset=True).items():
            setattr(menu, key, value)

        self.menu_repo.db.commit()
        self.menu_repo.db.refresh(menu)
        return menu
