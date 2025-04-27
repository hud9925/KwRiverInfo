import time
from typing import List, Dict

from .constants import CODES, FULL, UNITS, CHUNK, THROTTLE_S
from .client     import fetch_latest, extract_last_row
from .models     import Observation, get_session

def build_rows_for_station(station_id: str, station_meta: dict) -> List[dict]:
    """
    Returns a list of dicts suitable for bulk insert into DB.
    """
    # map ts_id → parameter code
    ts2code: Dict[str,str] = {
        str(e["ts_id"]): code
        for code, lst in station_meta["timeseries"].items() if code in CODES
        for e in lst
    }
    rows: List[dict] = []
    ids = list(ts2code.keys())

    for i in range(0, len(ids), CHUNK):
        series = fetch_latest(ids[i:i+CHUNK])
        for s in series:
            code = ts2code.get(str(s["ts_id"]))
            last = extract_last_row(s)
            if not (code and last and last["value"] not in (None, "")):
                continue
            unit = s.get("ts_unitname") or UNITS[code]
            rows.append({
                "timestamp":            last["timestamp"],
                "value":                float(last["value"]),
                "ts_id":                s["ts_id"],
                "station_id":           station_id,
                "parameter_type_name":  code,
                "parameter_fullname":   FULL[code],
                "unit":                 unit,
            })
        time.sleep(THROTTLE_S)
    return rows

def save_rows(rows: List[dict]) -> int:
    """
    Bulk-insert rows; duplicates (same ts_id + timestamp) will be ignored
    by primary/unique key if you add one later.
    """
    if not rows:
        return 0
    with get_session() as s:
        s.bulk_insert_mappings(Observation, rows)
        s.commit()
    return len(rows)
