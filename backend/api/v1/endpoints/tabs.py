from fastapi import APIRouter, Depends, status, Response
from typing import List
from schemas.tab_schema import TabResponse
from services.tab_service import TabService
from models.user_model import User
from models.menu_model import Menu

# 🔥 의존성을 전용 폴더에서 가져옵니다.
from api.v1.dependencies.service_deps import get_tab_service
from api.v1.dependencies.auth_deps import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TabResponse])
def read_tab_me(
    menu_id: str,
    current_user: User = Depends(get_current_user), # 토큰을 까서 현재 유저를 가져옴
    service: TabService = Depends(get_tab_service) 
):
    print(f"탭 목록 조회 요청: user_role={current_user.role.value}, menu_id={menu_id}")
    
    # 서비스 계층에 유저 ID를 넘겨 메뉴 목록을 받아옵니다.
    tabs = service.get_tabs_for_menu_role(menu_id, current_user.role.value)
    
    return tabs

# @router.post("/signup", status_code=status.HTTP_201_CREATED)
# def signup(
#     user_data: UserCreate, 
#     service: UserService = Depends(get_user_service) # 깔끔하게 주입 완료!
# ):
#     return service.register_user(user_data)

# @router.get("/me", response_model=UserResponse)
# def read_user_me(current_user: User = Depends(get_current_user)):
#     """
#     Depends(get_current_user)가 알아서 토큰을 검사하고 유저 객체를 넣어줍니다.
#     토큰이 없거나 이상하면 알아서 401 에러를 튕겨냅니다.
#     """
#     return current_user

# @router.put("/me")
# def update_user_me(
#     update_data: UserUpdate,
#     current_user: User = Depends(get_current_user),
#     service: UserService = Depends(get_user_service)
# ):
#     # current_user(현재 로그인된 유저 객체)와 프론트엔드에서 받은 update_data를 서비스로 넘깁니다.
#     return service.update_profile(current_user, update_data)

# @router.post("/login")
# def login(
#     login_data: UserLogin,
#     response: Response, # 브라우저 쿠키를 굽기 위해 Response 객체 주입
#     service: UserService = Depends(get_user_service)
# ):
#     # 1. 서비스 레이어에서 비즈니스 로직(토큰 발급) 처리
#     result = service.login_user(login_data)

#     # 2. HttpOnly 쿠키 설정 (보안 강화: JS에서 토큰 탈취 방지)
#     # 이전 단계(auth_deps.py)에서 쿠키와 헤더 모두에서 토큰을 읽도록 설계했으므로 완벽히 호환됩니다.
#     response.set_cookie(
#         key="access_token",
#         value=f"Bearer {result['access_token']}",
#         httponly=True,  # 자바스크립트로 쿠키에 접근하는 것을 차단 (XSS 방어)
#         max_age=1800,   # 30분 (1800초)
#         samesite="lax", # CSRF 공격 완화
#         secure=False    # 로컬 개발용(HTTP)이므로 False, 운영(HTTPS) 배포 시 True로 변경
#     )

#     return result

# @router.post("/logout")
# def logout(response: Response):
#     # 로그아웃은 단순히 발급된 쿠키를 삭제(만료) 시키는 것으로 구현합니다.
#     response.delete_cookie("access_token")
#     return {"success": True, "message": "성공적으로 로그아웃 되었습니다."}

# @router.put("/me/password")
# def change_my_password(
#     pw_data: PasswordChange,
#     current_user: User = Depends(get_current_user),
#     service: UserService = Depends(get_user_service)
# ):
#     return service.change_password(current_user, pw_data)