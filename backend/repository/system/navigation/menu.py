from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from model.system.navigation import Menu
from repository.base_repository import BaseRepository


class MenuRepository(BaseRepository[Menu]):
    def __init__(self, db: Session):
        super().__init__(Menu, db)

    def get_list_by_roles(self, roles: list[str], include_inactive: bool = False) -> list[Menu]:
        query = self.db.query(Menu).filter(Menu.role.in_(roles))
        if not include_inactive:
            query = query.filter(Menu.use_yn == "Y")

        menus = query.order_by(Menu.seq).all()
        if menus:
            return menus

        return self._get_legacy_list_by_roles(roles, include_inactive)

    def get_by_menu_id(self, menu_id: str) -> Menu | None:
        menu = self.db.query(Menu).filter(Menu.menu_id == menu_id).first()
        if menu:
            return menu

        return self._get_legacy_by_menu_id(menu_id)

    def _has_legacy_table(self) -> bool:
        return "menus" in inspect(self.db.bind).get_table_names()

    def _row_to_menu(self, row) -> Menu:
        return Menu(**dict(row._mapping))

    def _get_legacy_list_by_roles(self, roles: list[str], include_inactive: bool = False) -> list[Menu]:
        if not self._has_legacy_table():
            return []

        params = {f"role_{index}": role for index, role in enumerate(roles)}
        role_params = ", ".join(f":role_{index}" for index in range(len(roles)))
        use_filter = "" if include_inactive else " AND use_yn = 'Y'"
        rows = self.db.execute(
            text(f"SELECT * FROM menus WHERE role IN ({role_params}){use_filter} ORDER BY seq"),
            params,
        ).all()
        return [self._row_to_menu(row) for row in rows]

    def _get_legacy_by_menu_id(self, menu_id: str) -> Menu | None:
        if not self._has_legacy_table():
            return None

        row = self.db.execute(
            text("SELECT * FROM menus WHERE menu_id = :menu_id LIMIT 1"),
            {"menu_id": menu_id},
        ).first()
        return self._row_to_menu(row) if row else None
