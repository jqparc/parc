from datetime import date, datetime, timedelta
from functools import lru_cache
import json
from typing import List, Optional
from urllib.error import URLError
from urllib.request import urlopen

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from api.v1.dependencies.auth_deps import get_current_user, get_optional_current_user
from db.database import get_db
from models.calendar_model import CalendarEvent
from models.user_model import User
from schemas.calendar_schema import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
    CalendarHolidayResponse,
)

router = APIRouter()


SUBSTITUTE_WEEKEND_KEYWORDS = (
    "Independence Movement Day",
    "Buddha",
    "Children",
    "Liberation",
    "National Liberation Day",
    "National Foundation",
    "Gaecheonjeol",
    "Hangul",
    "Hangeul",
    "Christmas",
    "Labour Day",
    "Labor Day",
    "Constitution Day",
)

SUBSTITUTE_SUNDAY_KEYWORDS = (
    "Korean New Year",
    "Seollal",
    "Lunar New Year",
    "Chuseok",
)


def parse_holiday_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def holiday_matches(holiday: dict, keywords: tuple[str, ...]) -> bool:
    text = f"{holiday.get('localName', '')} {holiday.get('name', '')}"
    return any(keyword in text for keyword in keywords)


def next_available_holiday_date(base_date: date, occupied_dates: set[date]) -> date:
    candidate = base_date + timedelta(days=1)
    while candidate.weekday() >= 5 or candidate in occupied_dates:
        candidate += timedelta(days=1)
    return candidate


def normalize_holiday(holiday: dict) -> dict:
    return {
        "date": holiday["date"],
        "localName": holiday.get("localName", holiday.get("name", "")),
        "name": holiday.get("name", ""),
    }


def with_korean_substitute_holidays(holidays: list[dict], year: int) -> list[dict]:
    normalized = [normalize_holiday(holiday) for holiday in holidays]
    occupied_dates = {parse_holiday_date(holiday["date"]) for holiday in normalized}
    holiday_date_counts: dict[date, int] = {}

    for holiday in normalized:
        holiday_date = parse_holiday_date(holiday["date"])
        holiday_date_counts[holiday_date] = holiday_date_counts.get(holiday_date, 0) + 1

    substitutes = []
    substitute_sources = set()

    for holiday in normalized:
        holiday_date = parse_holiday_date(holiday["date"])
        is_weekend_target = holiday_matches(holiday, SUBSTITUTE_WEEKEND_KEYWORDS)
        is_sunday_target = holiday_matches(holiday, SUBSTITUTE_SUNDAY_KEYWORDS)
        overlaps_public_holiday = holiday_date_counts.get(holiday_date, 0) > 1

        needs_substitute = (
            (is_weekend_target and (holiday_date.weekday() >= 5 or overlaps_public_holiday))
            or (is_sunday_target and (holiday_date.weekday() == 6 or overlaps_public_holiday))
        )
        if not needs_substitute:
            continue

        source_key = (holiday["date"], holiday["name"], holiday["localName"])
        if source_key in substitute_sources:
            continue

        substitute_date = next_available_holiday_date(holiday_date, occupied_dates)
        if substitute_date.year != year:
            continue

        substitute_sources.add(source_key)
        occupied_dates.add(substitute_date)
        substitutes.append(
            {
                "date": substitute_date.isoformat(),
                "localName": f"{holiday['localName']} 대체공휴일",
                "name": f"Substitute holiday for {holiday['name'] or holiday['localName']}",
            }
        )

    return sorted(normalized + substitutes, key=lambda holiday: holiday["date"])


@lru_cache(maxsize=16)
def fetch_korean_public_holidays(year: int) -> tuple[dict, ...]:
    url = f"https://date.nager.at/api/v3/PublicHolidays/{year}/KR"
    try:
        with urlopen(url, timeout=5) as response:
            holidays = json.loads(response.read().decode("utf-8"))
    except (OSError, URLError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=502, detail="Failed to load Korean public holidays.") from exc

    return tuple(with_korean_substitute_holidays(holidays, year))


def validate_holiday_year(year: int) -> None:
    if year < 1900 or year > 2100:
        raise HTTPException(status_code=400, detail="Year must be between 1900 and 2100.")


@router.get("/holidays", response_model=List[CalendarHolidayResponse])
def get_holidays(year: int):
    validate_holiday_year(year)
    return list(fetch_korean_public_holidays(year))


@router.get("/holidays/{year}", response_model=List[CalendarHolidayResponse])
def get_korean_public_holidays(year: int):
    validate_holiday_year(year)
    return list(fetch_korean_public_holidays(year))


@router.get("", response_model=List[CalendarEventResponse])
def get_calendar_events(
    start: Optional[date] = None,
    end: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User | None = Depends(get_optional_current_user),
):
    if current_user is None:
        return []

    query = db.query(CalendarEvent)
    if getattr(current_user, "role", "USER") != "ADMIN":
        query = query.filter(CalendarEvent.owner_id == current_user.id)

    if start:
        query = query.filter(CalendarEvent.start >= start)
    if end:
        query = query.filter(CalendarEvent.start <= end)

    return query.order_by(CalendarEvent.start.asc(), CalendarEvent.id.asc()).all()


@router.post(
    "",
    response_model=CalendarEventResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_calendar_event(
    event_data: CalendarEventCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    event = CalendarEvent(owner_id=current_user.id, **event_data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@router.put("/{event_id}", response_model=CalendarEventResponse)
def update_calendar_event(
    event_id: int,
    event_data: CalendarEventUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CalendarEvent).filter(CalendarEvent.id == event_id)
    if getattr(current_user, "role", "USER") != "ADMIN":
        query = query.filter(CalendarEvent.owner_id == current_user.id)

    event = query.first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found or unauthorized.")

    for field, value in event_data.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    db.commit()
    db.refresh(event)
    return event


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_calendar_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(CalendarEvent).filter(CalendarEvent.id == event_id)
    if getattr(current_user, "role", "USER") != "ADMIN":
        query = query.filter(CalendarEvent.owner_id == current_user.id)

    event = query.first()
    if not event:
        raise HTTPException(status_code=404, detail="Calendar event not found or unauthorized.")

    db.delete(event)
    db.commit()
    return None
