from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError

from api.v1.dependencies.auth_deps import get_current_user, get_optional_current_user
from api.v1.dependencies.service_deps import get_tab_service
from models.user_model import User, UserRole
from schemas.tab_schema import TabCreate, TabResponse, TabUpdate
from services.tab_service import TabService

router = APIRouter()


@router.get("/", response_model=List[TabResponse])
def read_tab_me(
    menu_id: str,
    include_inactive: bool = False,
    current_user: User | None = Depends(get_optional_current_user),
    service: TabService = Depends(get_tab_service),
):
    role = current_user.role.value if current_user else "ALL"
    can_include_inactive = bool(
        include_inactive and current_user and current_user.role == UserRole.ADMIN
    )
    return service.get_tabs_for_menu_role(menu_id, role, can_include_inactive)


def require_admin(current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return

    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin permission required.")


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
        raise HTTPException(status_code=400, detail="Tab ID already exists in this menu.") from exc


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
        raise HTTPException(status_code=404, detail="Tab not found.")

    return tab
