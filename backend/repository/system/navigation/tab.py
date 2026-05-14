from sqlalchemy import inspect, text
from sqlalchemy.orm import Session

from model.system.navigation import Tab
from repository.base_repository import BaseRepository


class TabRepository(BaseRepository[Tab]):
    def __init__(self, db: Session):
        super().__init__(Tab, db)

    def get_by_menu_and_tab_id(self, menu_id: str, tab_id: str) -> Tab | None:
        tab = self.db.query(Tab).filter(Tab.menu_id == menu_id, Tab.tab_id == tab_id).first()
        if tab:
            return tab

        return self._get_legacy_by_menu_and_tab_id(menu_id, tab_id)

    def get_list_by_menu_and_roles(
        self,
        menu_id: str,
        roles: list[str],
        include_inactive: bool = False,
    ) -> list[Tab]:
        query = self.db.query(Tab).filter(Tab.menu_id == menu_id, Tab.role.in_(roles))
        if not include_inactive:
            query = query.filter(Tab.use_yn == "Y")

        tabs = query.order_by(Tab.seq).all()
        if tabs:
            return tabs

        return self._get_legacy_list_by_menu_and_roles(menu_id, roles, include_inactive)

    def _has_legacy_table(self) -> bool:
        return "tabs" in inspect(self.db.bind).get_table_names()

    def _row_to_tab(self, row) -> Tab:
        return Tab(**dict(row._mapping))

    def _get_legacy_by_menu_and_tab_id(self, menu_id: str, tab_id: str) -> Tab | None:
        if not self._has_legacy_table():
            return None

        row = self.db.execute(
            text("SELECT * FROM tabs WHERE menu_id = :menu_id AND tab_id = :tab_id LIMIT 1"),
            {"menu_id": menu_id, "tab_id": tab_id},
        ).first()
        return self._row_to_tab(row) if row else None

    def _get_legacy_list_by_menu_and_roles(
        self,
        menu_id: str,
        roles: list[str],
        include_inactive: bool = False,
    ) -> list[Tab]:
        if not self._has_legacy_table():
            return []

        params = {"menu_id": menu_id}
        params.update({f"role_{index}": role for index, role in enumerate(roles)})
        role_params = ", ".join(f":role_{index}" for index in range(len(roles)))
        use_filter = "" if include_inactive else " AND use_yn = 'Y'"
        rows = self.db.execute(
            text(
                "SELECT * FROM tabs "
                f"WHERE menu_id = :menu_id AND role IN ({role_params}){use_filter} "
                "ORDER BY seq"
            ),
            params,
        ).all()
        return [self._row_to_tab(row) for row in rows]
