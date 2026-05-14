from datetime import date
from typing import List, Optional

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from api.v1.dependency.auth_dep import get_current_user, get_optional_current_user
from db.database import get_db
from model.system.user import User
from schema.calendar import CalendarEventCreate, CalendarEventResponse, CalendarEventUpdate
from service.calendar import CalendarEventService

router = APIRouter()


def get_calendar_event_service(db: Session = Depends(get_db)) -> CalendarEventService:
    return CalendarEventService(db)


@router.get("", response_model=List[CalendarEventResponse])
def get_calendar_events(
    start: Optional[date] = None,
    end: Optional[date] = None,
    current_user: User | None = Depends(get_optional_current_user),
    service: CalendarEventService = Depends(get_calendar_event_service),
):
    return service.list_events(current_user, start, end)


@router.post(
    "",
    response_model=CalendarEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_calendar_event(
    event_data: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    service: CalendarEventService = Depends(get_calendar_event_service),
):
    return service.create_event(current_user, event_data)


@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: int,
    event_data: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    service: CalendarEventService = Depends(get_calendar_event_service),
):
    return service.update_event(current_user, event_id, event_data)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_event(
    event_id: int,
    current_user: User = Depends(get_current_user),
    service: CalendarEventService = Depends(get_calendar_event_service),
):
    service.delete_event(current_user, event_id)
    return None
