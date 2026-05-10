import json
import re
from decimal import Decimal, InvalidOperation
from time import monotonic
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


NAVER_SEARCH_URL = "https://m.stock.naver.com/front-api/search/autoComplete"
NAVER_DOMESTIC_PRICE_URL = "https://polling.finance.naver.com/api/realtime/domestic/stock"
NAVER_STOCK_PAGE_URL = "https://finance.naver.com/item/main.naver"
REQUEST_HEADERS = {"User-Agent": "Mozilla/5.0"}
QUOTE_CACHE_TTL_SECONDS = 300

MARKET_CODE_MAP = {
    "KOSPI": "A",
    "KOSDAQ": "B",
    "KONEX": "C",
}

_symbol_cache: dict[str, tuple[str | None, str | None]] = {}
_sector_cache: dict[str, str | None] = {}
_quote_cache: dict[str, tuple[float, dict]] = {}


def _load_json(url: str) -> dict:
    request = Request(url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=8) as response:
        return json.loads(response.read().decode("utf-8"))


def _load_text(url: str, encoding: str = "euc-kr") -> str:
    request = Request(url, headers=REQUEST_HEADERS)
    with urlopen(request, timeout=8) as response:
        return response.read().decode(encoding, errors="ignore")


def _to_decimal(value) -> Decimal | None:
    if value is None:
        return None
    try:
        return Decimal(str(value).replace(",", "")).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError):
        return None


def clean_stock_code(value: str | None) -> str | None:
    if not value:
        return None

    code = value.replace(".KS", "").replace(".KQ", "").strip()
    return code if code.isdigit() and len(code) == 6 else None


def find_domestic_stock_code(stock_name: str) -> tuple[str | None, str | None]:
    if stock_name in _symbol_cache:
        return _symbol_cache[stock_name]

    params = {
        "query": stock_name,
        "target": "stock,index,marketindicator,coin,ipo",
    }
    url = f"{NAVER_SEARCH_URL}?{urlencode(params)}"

    try:
        payload = _load_json(url)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None, None

    items = payload.get("result", {}).get("items", [])
    for item in items:
        code = clean_stock_code(item.get("reutersCode") or item.get("code"))
        market = item.get("typeCode")
        if code and market in MARKET_CODE_MAP:
            result = (code, market)
            _symbol_cache[stock_name] = result
            return result

    result = (None, None)
    _symbol_cache[stock_name] = result
    return result


def get_current_quote(stock_code: str) -> dict | None:
    code = clean_stock_code(stock_code)
    if not code:
        return None

    cached_quote = _quote_cache.get(code)
    if cached_quote and monotonic() - cached_quote[0] < QUOTE_CACHE_TTL_SECONDS:
        return cached_quote[1]

    url = f"{NAVER_DOMESTIC_PRICE_URL}/{code}"

    try:
        payload = _load_json(url)
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return None

    datas = payload.get("datas", [])
    if not datas:
        return None

    data = datas[0]
    quote = {
        "code": code,
        "name": data.get("stockName") or data.get("itemName") or data.get("name"),
        "price": _to_decimal(data.get("closePrice")),
    }
    _quote_cache[code] = (monotonic(), quote)
    return quote


def get_current_price(stock_code: str) -> Decimal | None:
    quote = get_current_quote(stock_code)
    if quote:
        return quote.get("price")
    return None


def get_sector_name(stock_code: str) -> str | None:
    code = clean_stock_code(stock_code)
    if not code:
        return None
    if code in _sector_cache:
        return _sector_cache[code]

    url = f"{NAVER_STOCK_PAGE_URL}?{urlencode({'code': code})}"
    try:
        html = _load_text(url)
    except (HTTPError, URLError, TimeoutError):
        return None

    match = re.search(r"\uc5c5\uc885\uba85\s*:\s*<a[^>]*>([^<]+)</a>", html)
    sector_name = match.group(1).strip() if match else None
    _sector_cache[code] = sector_name
    return sector_name


def resolve_stock_metadata(
    stock_name: str,
    stock_code: str | None = None,
) -> tuple[str | None, str | None, str | None, Decimal | None]:
    code = clean_stock_code(stock_code)
    market = None

    if not code:
        code, market = find_domestic_stock_code(stock_name)

    if not code:
        return None, None, None, None

    return code, market, get_sector_name(code), get_current_price(code)


def resolve_current_price(stock_name: str, stock_code: str | None = None) -> tuple[str | None, str | None, Decimal | None]:
    code, market, _, current_price = resolve_stock_metadata(stock_name, stock_code)
    return code, market, current_price


def resolve_stock_item_snapshot(
    stock_code: str,
    fallback_name: str | None = None,
) -> tuple[str | None, str | None, str | None, Decimal | None]:
    code = clean_stock_code(stock_code)
    if not code:
        return None, None, None, None

    quote = get_current_quote(code) or {}
    name = quote.get("name") or fallback_name or code
    _, market = find_domestic_stock_code(name)
    return name, MARKET_CODE_MAP.get(market), get_sector_name(code), quote.get("price")


get_sector = get_sector_name
