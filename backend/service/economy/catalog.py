from dataclasses import dataclass


@dataclass(frozen=True)
class IndicatorDefinition:
    symbol: str
    name: str
    unit: str


INDICATOR_DEFINITIONS = (
    IndicatorDefinition("^GSPC", "S&P 500", "pt"),
    IndicatorDefinition("^IXIC", "Nasdaq Composite", "pt"),
    IndicatorDefinition("^DJI", "Dow Jones Industrial Average", "pt"),
    IndicatorDefinition("^VIX", "CBOE Volatility Index", "pt"),
    IndicatorDefinition("^KS11", "KOSPI", "pt"),
    IndicatorDefinition("^KQ11", "KOSDAQ", "pt"),
    IndicatorDefinition("KRW=X", "USD/KRW", "KRW"),
    IndicatorDefinition("DX-Y.NYB", "US Dollar Index", "pt"),
    IndicatorDefinition("EURUSD=X", "EUR/USD", "USD"),
    IndicatorDefinition("JPY=X", "USD/JPY", "JPY"),
    IndicatorDefinition("^TNX", "US 10Y Treasury Yield", "%"),
    IndicatorDefinition("^IRX", "US 13 Week Treasury Yield", "%"),
    IndicatorDefinition("GC=F", "Gold Futures", "USD"),
    IndicatorDefinition("CL=F", "WTI Crude Oil Futures", "USD"),
    IndicatorDefinition("SI=F", "Silver Futures", "USD"),
)


def get_indicator_definitions() -> dict[str, IndicatorDefinition]:
    return {definition.symbol: definition for definition in INDICATOR_DEFINITIONS}
