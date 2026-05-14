from fastapi import APIRouter, Depends

from api.v1.dependency.auth_dep import get_current_user
from model.system.user import User
from schema.economy.info import BoardResponse
from service.economy.info import BoardService
from .dependency import get_board_service
from .guard import check_admin

router = APIRouter()


@router.get("/board", response_model=list[BoardResponse])
def get_boards(
    current_user: User = Depends(get_current_user),
    board_service: BoardService = Depends(get_board_service),
):
    check_admin(current_user)
    return board_service.list_active_boards()
