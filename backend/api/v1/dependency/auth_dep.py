from fastapi import Depends, Request
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from core.config import settings
from core.exception import unauthorized
from db.database import get_db
from model.user import User
from repository.user import UserRepository


def extract_token(request: Request) -> str | None:
    token = request.cookies.get("access_token")

    if not token and "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.replace("Bearer ", "")

    if token and token.startswith("Bearer "):
        token = token.replace("Bearer ", "")

    return token


def decode_token_subject(token: str) -> str | None:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

    return payload.get("sub")


def get_optional_current_user(request: Request, db: Session = Depends(get_db)) -> User | None:
    token = extract_token(request)
    if not token:
        return None

    user_id = decode_token_subject(token)
    if not user_id:
        return None

    user_repo = UserRepository(db)
    return user_repo.get_by_user_id(user_id=user_id)


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = extract_token(request)
    if not token:
        raise unauthorized("Login required.")

    user_id = decode_token_subject(token)
    if not user_id:
        raise unauthorized("Authentication token is invalid or expired.")

    user_repo = UserRepository(db)
    user = user_repo.get_by_user_id(user_id=user_id)
    if user is None:
        raise unauthorized("User was not found.")

    return user
