from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class CalendarEventBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=120)
    start: date
    color: str = Field(default="#2563eb", pattern=r"^#[0-9a-fA-F]{6}$")


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=120)
    start: date | None = None
    color: str | None = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class CalendarEventResponse(CalendarEventBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
