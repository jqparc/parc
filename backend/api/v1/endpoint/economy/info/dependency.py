from fastapi import Depends
from sqlalchemy.orm import Session

from db.database import get_db
from service.economy.info import BoardService, PostService


def get_board_service(db: Session = Depends(get_db)) -> BoardService:
    return BoardService(db)


def get_post_service(db: Session = Depends(get_db)) -> PostService:
    return PostService(db)
