from datetime import date

from pydantic import BaseModel


class CalendarHolidayResponse(BaseModel):
    date: date
    localName: str
    name: str
