from fastapi import APIRouter, Depends

from api.v1.dependency.auth_dep import get_current_user
from api.v1.dependency.service_dep import get_mypage_service
from model.user import User
from schema.user import PasswordChange, PasswordVerify, UserResponse, UserUpdate
from service.user import MyPageService

router = APIRouter()


@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_user_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: MyPageService = Depends(get_mypage_service),
):
    return service.update_profile(current_user, update_data)


@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: MyPageService = Depends(get_mypage_service),
):
    return service.update_profile(current_user, update_data)


@router.post("/me/password/verify")
def verify_my_password_for_change(
    verify_data: PasswordVerify,
    current_user: User = Depends(get_current_user),
    service: MyPageService = Depends(get_mypage_service),
):
    return service.verify_password(current_user, verify_data)


@router.put("/me/password")
def change_my_password(
    pw_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    service: MyPageService = Depends(get_mypage_service),
):
    return service.change_password(current_user, pw_data)
