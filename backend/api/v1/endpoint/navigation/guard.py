from core.exception import forbidden
from model.user import User, UserRole


def require_admin(current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return

    raise forbidden("Admin permission required.")
