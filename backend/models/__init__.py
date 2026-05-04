# backend/models/__init__.py

# 1. DB Base를 가져옵니다.
from db.database import Base

# 2. 모든 모델들을 이곳에 모아줍니다. (파이썬이 이 파일들을 읽어 Base에 등록하게 됨)
from .user_model import User
from .board_model import Board
from .post_model import Post
from .menu_model import Menu
from .tab_model import Tab

# (선택) 외부에서 models를 import 할 때 어떤 것들을 쓸 수 있는지 명시합니다.
__all__ = ["Base", "User", "Board", "Post", "Menu", "Tab"]