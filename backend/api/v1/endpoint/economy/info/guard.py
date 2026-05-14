from core.exception import forbidden
from model.user import User, UserRole


def check_post_owner_or_admin(post_author_id: int, current_user: User) -> None:
    if current_user.id == post_author_id or current_user.role == UserRole.ADMIN:
        return

    raise forbidden("You do not have permission for this post.")


def check_admin(current_user: User) -> None:
    if current_user.role == UserRole.ADMIN:
        return

    raise forbidden("Admin permission required.")
