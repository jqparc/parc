from sqlalchemy.orm import Session

from core.exception import not_found
from model.economy.info import Board
from repository.economy.info import BoardRepository


class BoardService:
    def __init__(self, db: Session):
        self.board_repo = BoardRepository(db)

    def list_active_boards(self) -> list[Board]:
        return self.board_repo.list_active()

    def get_active_board_by_code(self, board_code: str) -> Board:
        board = self.board_repo.get_active_by_code(board_code)
        if not board:
            raise not_found("Board not found.")

        return board
