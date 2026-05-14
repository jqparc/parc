from datetime import date

from sqlalchemy.orm import Session

from core.exception import not_found
from model.calendar import CalendarEvent
from model.user import User
from repository.calendar import CalendarEventRepository
from schema.calendar import CalendarEventCreate, CalendarEventUpdate


class CalendarEventService:
    def __init__(self, db: Session):
        self.event_repo = CalendarEventRepository(db)

    def list_events(
        self,
        current_user: User | None,
        start: date | None = None,
        end: date | None = None,
    ) -> list[CalendarEvent]:
        if current_user is None:
            return []

        return self.event_repo.list_visible(current_user, start, end)

    def create_event(self, current_user: User, event_data: CalendarEventCreate) -> CalendarEvent:
        event = CalendarEvent(owner_id=current_user.id, **event_data.model_dump())
        return self.event_repo.create(event)

    def update_event(
        self,
        current_user: User,
        event_id: int,
        event_data: CalendarEventUpdate,
    ) -> CalendarEvent:
        event = self.event_repo.get_visible(current_user, event_id)
        if not event:
            raise not_found("Calendar event not found or unauthorized.")

        for field, value in event_data.model_dump(exclude_unset=True).items():
            setattr(event, field, value)

        return self.event_repo.save(event)

    def delete_event(self, current_user: User, event_id: int) -> None:
        event = self.event_repo.get_visible(current_user, event_id)
        if not event:
            raise not_found("Calendar event not found or unauthorized.")

        self.event_repo.delete(event)
