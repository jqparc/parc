from fastapi import APIRouter, Depends, Response, status

from api.v1.dependency.auth_dep import get_current_user
from api.v1.dependency.service_dep import get_auth_service
from core.security import create_access_token
from model.user import User
from schema.user import UserCreate, UserLogin
from service.user import AuthService
from .cookie import set_access_token_cookie

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    user_data: UserCreate,
    service: AuthService = Depends(get_auth_service),
):
    return service.register_user(user_data)


@router.get("/availability")
def check_user_availability(
    user_id: str | None = None,
    nickname: str | None = None,
    service: AuthService = Depends(get_auth_service),
):
    return service.check_availability(user_id=user_id, nickname=nickname)


@router.post("/login")
def login(
    login_data: UserLogin,
    response: Response,
    service: AuthService = Depends(get_auth_service),
):
    result = service.login_user(login_data)
    set_access_token_cookie(response, result["access_token"])
    return result


@router.post("/refresh")
def refresh_session(
    response: Response,
    current_user: User = Depends(get_current_user),
):
    access_token = create_access_token(data={"sub": current_user.user_id})
    set_access_token_cookie(response, access_token)
    return {"success": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"success": True, "message": "Logged out successfully."}
