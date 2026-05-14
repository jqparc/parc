from sqlalchemy.orm import Session

from model.economy.info import Board


class BoardRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_active_by_code(self, board_code: str) -> Board | None:
        return (
            self.db.query(Board)
            .filter(Board.code == board_code, Board.is_active.is_(True))
            .first()
        )

    def list_active(self) -> list[Board]:
        return (
            self.db.query(Board)
            .filter(Board.is_active.is_(True))
            .order_by(Board.id)
            .all()
        )
