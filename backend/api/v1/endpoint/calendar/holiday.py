from typing import List

from fastapi import APIRouter, Depends

from schema.calendar import CalendarHolidayResponse
from service.calendar import CalendarHolidayService

router = APIRouter()


def get_calendar_holiday_service() -> CalendarHolidayService:
    return CalendarHolidayService()


@router.get("/holiday", response_model=List[CalendarHolidayResponse])
def get_holidays(
    year: int,
    service: CalendarHolidayService = Depends(get_calendar_holiday_service),
):
    return service.list_korean_public_holidays(year)


@router.get("/holiday/{year}", response_model=List[CalendarHolidayResponse])
def get_korean_public_holidays(
    year: int,
    service: CalendarHolidayService = Depends(get_calendar_holiday_service),
):
    return service.list_korean_public_holidays(year)
