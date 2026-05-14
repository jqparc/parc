from sqlalchemy.orm import Session

from model.economy.info import Post
from repository.economy.info import PostRepository
from schema.economy.info import PostCreate, PostUpdate


class PostService:
    def __init__(self, db: Session):
        self.post_repo = PostRepository(db)

    def create_new_post(self, post_data: PostCreate, board_id: int, user_id: int) -> Post:
        return self.post_repo.create(
            title=post_data.title,
            content=post_data.content,
            board_id=board_id,
            author_id=user_id,
            is_notice=post_data.is_notice,
        )

    def get_posts_by_board(self, board_id: int, page: int = 1, size: int = 10) -> dict:
        total_count = self.post_repo.count_by_board_id(board_id)
        skip = (page - 1) * size
        posts = self.post_repo.list_by_board_id(board_id, skip, size)
        total_pages = (total_count + size - 1) // size

        return {
            "posts": posts,
            "total_pages": total_pages,
            "current_page": page,
            "total_count": total_count,
        }

    def get_post_detail(self, post_id: int) -> Post | None:
        return self.post_repo.get_by_id(post_id)

    def get_post_detail_by_board(self, post_id: int, board_id: int) -> Post | None:
        return self.post_repo.get_by_id_and_board_id(post_id, board_id)

    def update_existing_post(self, post_id: int, post_data: PostUpdate) -> Post | None:
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return None

        update_data = post_data.model_dump(exclude_unset=True)
        if not update_data:
            return post

        return self.post_repo.update(post, update_data)

    def delete_existing_post(self, post_id: int) -> bool:
        post = self.post_repo.get_by_id(post_id)
        if not post:
            return False

        self.post_repo.soft_delete(post)
        return True
