from fastapi import Depends
from sqlalchemy.orm import Session

from db.database import get_db
from service.navigation import MenuService, TabService
from service.user import AuthService, MyPageService, UserService


def get_user_service(db: Session = Depends(get_db)) -> UserService:
    return UserService(db)


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(db)


def get_mypage_service(db: Session = Depends(get_db)) -> MyPageService:
    return MyPageService(db)


def get_menu_service(db: Session = Depends(get_db)) -> MenuService:
    return MenuService(db)


def get_tab_service(db: Session = Depends(get_db)) -> TabService:
    return TabService(db)
