from .catalog import get_indicator_definitions

TARGET_INDICATORS = {
    symbol: {"name": definition.name, "unit": definition.unit}
    for symbol, definition in get_indicator_definitions().items()
}
