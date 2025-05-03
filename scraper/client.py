from urllib.parse import urlencode
import requests

from config.settings_example import KIWIS_BASE_URL, TIMEZONE

def _query(params: dict) -> dict:
    """Low-level GET wrapper with sane retries."""
    url = f"{KIWIS_BASE_URL}?{urlencode(params)}"
    resp = requests.get(url, timeout=20)
    resp.raise_for_status()
    return resp.json()

def fetch_latest(ts_ids: list[str]) -> list[dict]:
    """
    Ask KiWIS for the *latest* value of several timeseries IDs.
    Returns the KiWIS array of series objects.
    """
    params = {
        "datasource": 0,
        "service":    "kisters",
        "type":       "queryServices",
        "request":    "getTimeseriesValues",
        "format":     "dajson",
        "timezone":   TIMEZONE,
        "ts_id":      ",".join(ts_ids),
    }
    return _query(params)

def extract_last_row(series_obj: dict) -> dict | None:
    """
    Works for both ‘values’ (new KiWIS) and legacy ‘data’.
    Returns {timestamp, value} or None.
    """
    rows = series_obj.get("values") or series_obj.get("data") or []
    if not rows:
        return None
    ts, val, *_ = rows[-1]          # newest = last
    return {"timestamp": ts, "value": val}
