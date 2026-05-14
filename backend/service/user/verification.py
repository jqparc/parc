from datetime import datetime, timedelta
from typing import Any

from jose import JWTError, jwt

from core.config import settings
from core.exception import bad_request
from model.user import User

MYPAGE_VERIFICATION_PURPOSE = "mypage_verification"
LEGACY_VERIFICATION_PURPOSES = {"password_change"}


class VerificationTokenService:
    def issue_mypage_token(self, user: User) -> str:
        payload = {
            "sub": user.user_id,
            "purpose": MYPAGE_VERIFICATION_PURPOSE,
            "exp": datetime.utcnow() + timedelta(minutes=5),
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    def verify_mypage_token(self, token: str, user: User) -> dict[str, Any]:
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except JWTError as exc:
            raise bad_request("Password verification has expired. Please verify again.") from exc

        purpose = payload.get("purpose")
        valid_purposes = {MYPAGE_VERIFICATION_PURPOSE, *LEGACY_VERIFICATION_PURPOSES}
        if payload.get("sub") != user.user_id or purpose not in valid_purposes:
            raise bad_request("Password verification token is invalid.")

        return payload
