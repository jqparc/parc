from datetime import date, datetime, timedelta
from functools import lru_cache
import json
from urllib.error import URLError
from urllib.request import urlopen

from core.exception import bad_gateway, bad_request

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
                "localName": f"{holiday['localName']} Substitute Holiday",
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
        raise bad_gateway("Failed to load Korean public holidays.") from exc

    return tuple(with_korean_substitute_holidays(holidays, year))


class CalendarHolidayService:
    def list_korean_public_holidays(self, year: int) -> list[dict]:
        if year < 1900 or year > 2100:
            raise bad_request("Year must be between 1900 and 2100.")

        return list(fetch_korean_public_holidays(year))
