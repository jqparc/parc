from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from api.v1.dependencies.auth_deps import get_current_user, get_optional_current_user
from api.v1.dependencies.service_deps import get_menu_service
from models.user_model import User, UserRole
from schemas.menu_schema import MenuCreate, MenuResponse, MenuUpdate
from services.menu_service import MenuService

router = APIRouter()


@router.get("/", response_model=List[MenuResponse])
def read_menu_me(
    include_inactive: bool = False,
    current_user: User | None = Depends(get_optional_current_user),
    service: MenuService = Depends(get_menu_service),
):
    role = current_user.role.value if current_user else "ALL"
    can_include_inactive = bool(
        include_inactive and current_user and current_user.role == UserRole.ADMIN
    )
    return service.get_menus_for_role(role, can_include_inactive)


def require_admin(current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required.")


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
        raise HTTPException(status_code=400, detail="Menu ID already exists.") from exc


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
        raise HTTPException(status_code=404, detail="Menu not found.")

    return menu
