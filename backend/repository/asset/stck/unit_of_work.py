from sqlalchemy.orm import Session


def commit(db: Session) -> None:
    db.commit()


def rollback(db: Session) -> None:
    db.rollback()


def refresh(db: Session, instance) -> None:
    db.refresh(instance)
