from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.exc import IntegrityError

from api.v1.dependency.auth_dep import get_current_user, get_optional_current_user
from api.v1.dependency.service_dep import get_menu_service
from core.exception import bad_request, not_found
from model.system.user import User
from schema.system.navigation import MenuCreate, MenuResponse, MenuUpdate
from service.system.navigation import MenuService
from service.system.navigation.role import can_include_inactive, get_user_role_value
from .guard import require_admin

router = APIRouter()


@router.get("/", response_model=List[MenuResponse])
def read_menu_me(
    include_inactive: bool = False,
    current_user: User | None = Depends(get_optional_current_user),
    service: MenuService = Depends(get_menu_service),
):
    role = get_user_role_value(current_user)
    return service.get_menus_for_role(
        role,
        can_include_inactive(current_user, include_inactive),
    )


@router.post("/", response_model=MenuResponse, status_code=status.HTTP_201_CREATED)
def create_menu(
    menu_data: MenuCreate,
    current_user: User = Depends(get_current_user),
    service: MenuService = Depends(get_menu_service),
):
    require_admin(current_user)
    try:
        return service.create_menu(menu_data)
    except IntegrityError as exc:
        service.menu_repo.db.rollback()
        raise bad_request("Menu ID already exists.") from exc


@router.patch("/{menu_id}", response_model=MenuResponse)
def update_menu(
    menu_id: str,
    menu_data: MenuUpdate,
    current_user: User = Depends(get_current_user),
    service: MenuService = Depends(get_menu_service),
):
    require_admin(current_user)
    menu = service.update_menu(menu_id, menu_data)
    if not menu:
        raise not_found("Menu not found.")

    return menu
