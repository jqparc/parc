from model.system.user import User, UserRole


def get_visible_roles(role: str | None, include_inactive: bool = False) -> list[str]:
    if role == UserRole.ADMIN.value and include_inactive:
        return [item.value for item in UserRole]

    roles = [UserRole.ALL.value]
    if role and role != UserRole.ALL.value:
        roles.append(role)

    return roles


def can_include_inactive(user: User | None, include_inactive: bool = False) -> bool:
    return bool(include_inactive and user and user.role == UserRole.ADMIN)


def get_user_role_value(user: User | None) -> str:
    return user.role.value if user else UserRole.ALL.value
