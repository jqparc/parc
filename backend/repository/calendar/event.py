from datetime import date

from sqlalchemy.orm import Query, Session

from model.calendar import CalendarEvent
from model.system.user import User, UserRole


class CalendarEventRepository:
    def __init__(self, db: Session):
        self.db = db

    def visible_query(self, current_user: User) -> Query:
        query = self.db.query(CalendarEvent)
        if current_user.role != UserRole.ADMIN:
            query = query.filter(CalendarEvent.owner_id == current_user.id)
        return query

    def list_visible(
        self,
        current_user: User,
        start: date | None = None,
        end: date | None = None,
    ) -> list[CalendarEvent]:
        query = self.visible_query(current_user)
        if start:
            query = query.filter(CalendarEvent.start >= start)
        if end:
            query = query.filter(CalendarEvent.start <= end)

        return query.order_by(CalendarEvent.start.asc(), CalendarEvent.id.asc()).all()

    def get_visible(self, current_user: User, event_id: int) -> CalendarEvent | None:
        return self.visible_query(current_user).filter(CalendarEvent.id == event_id).first()

    def create(self, event: CalendarEvent) -> CalendarEvent:
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def save(self, event: CalendarEvent) -> CalendarEvent:
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete(self, event: CalendarEvent) -> None:
        self.db.delete(event)
        self.db.commit()
