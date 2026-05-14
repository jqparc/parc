from typing import Any, Generic, Optional, TypeVar, cast

from sqlalchemy.orm import Session

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get(self, id: Any) -> Optional[ModelType]:
        model = cast(Any, self.model)
        return self.db.query(self.model).filter(model.id == id).first()

    def get_all(self) -> list[ModelType]:
        return self.db.query(self.model).all()

    def create(self, obj_in: dict[str, Any]) -> ModelType:
        db_obj = self.model(**obj_in)
        try:
            self.db.add(db_obj)
            self.db.commit()
            self.db.refresh(db_obj)
        except Exception:
            self.db.rollback()
            raise
        return db_obj
