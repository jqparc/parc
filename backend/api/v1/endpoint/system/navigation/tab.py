from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.exc import IntegrityError

from api.v1.dependency.auth_dep import get_current_user, get_optional_current_user
from api.v1.dependency.service_dep import get_tab_service
from core.exception import bad_request, not_found
from model.system.user import User
from schema.system.navigation import TabCreate, TabResponse, TabUpdate
from service.system.navigation import TabService
from service.system.navigation.role import can_include_inactive, get_user_role_value
from .guard import require_admin

router = APIRouter()


@router.get("/", response_model=List[TabResponse])
def read_tab_me(
    menu_id: str,
    include_inactive: bool = False,
    current_user: User | None = Depends(get_optional_current_user),
    service: TabService = Depends(get_tab_service),
):
    role = get_user_role_value(current_user)
    return service.get_tabs_for_menu_role(
        menu_id,
        role,
        can_include_inactive(current_user, include_inactive),
    )


@router.post("/", response_model=TabResponse, status_code=status.HTTP_201_CREATED)
def create_tab(
    tab_data: TabCreate,
    current_user: User = Depends(get_current_user),
    service: TabService = Depends(get_tab_service),
):
    require_admin(current_user)
    try:
        return service.create_tab(tab_data)
    except IntegrityError as exc:
        service.tab_repo.db.rollback()
        raise bad_request("Tab ID already exists in this menu.") from exc


@router.patch("/{menu_id}/{tab_id}", response_model=TabResponse)
def update_tab(
    menu_id: str,
    tab_id: str,
    tab_data: TabUpdate,
    current_user: User = Depends(get_current_user),
    service: TabService = Depends(get_tab_service),
):
    require_admin(current_user)
    tab = service.update_tab(menu_id, tab_id, tab_data)
    if not tab:
        raise not_found("Tab not found.")

    return tab
