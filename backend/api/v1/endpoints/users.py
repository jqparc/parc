from fastapi import APIRouter, Depends, status, Response, HTTPException
from schemas.user_schema import (
    PasswordChange,
    PasswordVerify,
    UserCreate,
    UserLogin,
    UserResponse,
    UserUpdate,
)
from services.user_service import UserService
from models.user_model import User # 모델 추가
# 🔥 의존성을 전용 폴더에서 가져옵니다.
from api.v1.dependencies.service_deps import get_user_service 
from api.v1.dependencies.auth_deps import get_current_user
from core.config import settings
from core.security import create_access_token


router = APIRouter()


def set_access_token_cookie(response: Response, access_token: str) -> None:
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        samesite="lax",
        secure=False
    )

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    user_data: UserCreate, 
    service: UserService = Depends(get_user_service) # 깔끔하게 주입 완료!
):
    return service.register_user(user_data)


@router.get("/availability")
def check_user_availability(
    user_id: str | None = None,
    nickname: str | None = None,
    service: UserService = Depends(get_user_service),
):
    return service.check_availability(user_id=user_id, nickname=nickname)

@router.get("/me", response_model=UserResponse)
def read_user_me(current_user: User = Depends(get_current_user)):
    """
    Depends(get_current_user)가 알아서 토큰을 검사하고 유저 객체를 넣어줍니다.
    토큰이 없거나 이상하면 알아서 401 에러를 튕겨냅니다.
    """
    return current_user

@router.put("/me")
def update_user_me(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    # current_user(현재 로그인된 유저 객체)와 프론트엔드에서 받은 update_data를 서비스로 넘깁니다.
    return service.update_profile(current_user, update_data)

@router.post("/login")
def login(
    login_data: UserLogin,
    response: Response, # 브라우저 쿠키를 굽기 위해 Response 객체 주입
    service: UserService = Depends(get_user_service)
):
    # 1. 서비스 레이어에서 비즈니스 로직(토큰 발급) 처리
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
    # 로그아웃은 단순히 발급된 쿠키를 삭제(만료) 시키는 것으로 구현합니다.
    response.delete_cookie("access_token")
    return {"success": True, "message": "성공적으로 로그아웃 되었습니다."}

@router.patch("/me", response_model=UserResponse)
def update_my_profile(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    """
    내 개인정보를 수정합니다. 
    보안을 위해 비밀번호 확인 절차에서 발급된 verification_token이 필수입니다.
    """
    # 1. 보안 검증: 수정 요청 시 verification_token이 있는지 확인
    if not update_data.verification_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="개인정보 수정을 위해 비밀번호 확인이 필요합니다."
        )

    # 2. 토큰 유효성 및 소유권 검증
    record = service.get_verification_record(update_data.verification_token)
    if not record or record.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="유효한 인증 기록을 찾을 수 없습니다."
        )
    
    if record.is_expired():
        raise HTTPException(status_code=400, detail="인증 시간이 만료되었습니다. 다시 시도해 주세요.")
    
    if record.is_used:
        raise HTTPException(status_code=400, detail="이미 사용된 인증 토큰입니다.")

    # 3. 실제 수정 프로세스 진행
    updated_user = service.update_profile(current_user, update_data)
    
    # 4. 보안 완료: 사용된 토큰을 즉시 '사용됨' 처리하여 재사용 방지
    service.mark_token_as_used(record)
    
    return updated_user

@router.put("/me/password")
def change_my_password(
    pw_data: PasswordChange,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service)
):
    # (기존의 토큰 검증 로직 유지 혹은 공통 함수로 호출)
    record = service.get_verification_record(pw_data.verification_token)
    
    if not record or record.owner_id != current_user.id:
        raise HTTPException(status_code=404, detail="인증 기록을 찾을 수 없습니다.")
    
    if record.is_expired() or record.is_used:
        raise HTTPException(status_code=400, detail="유효하지 않거나 만료된 토큰입니다.")

    # 비밀번호 업데이트
    service.update_password(current_user, pw_data.new_password)
    
    # 토큰 사용 완료 처리
    service.mark_token_as_used(record)
    
    return {"success": True, "message": "비밀번호가 성공적으로 변경되었습니다."}


@router.post("/me/password/verify")
def verify_my_password_for_change(
    verify_data: PasswordVerify,
    current_user: User = Depends(get_current_user),
    service: UserService = Depends(get_user_service),
):
    return service.verify_password_for_change(current_user, verify_data)
