import time
from typing import List, Dict

from sqlalchemy.orm.exc import NoResultFound

from .constants import CODES, FULL, UNITS, CHUNK, THROTTLE_S
from .client import fetch_latest, extract_last_row
from .models import get_session, Station, TimeseriesData


def build_rows_for_station(station_id_str: str, station_meta: dict) -> List[dict]:
    """
    Returns a list of dicts suitable for bulk insert into DB.
    """
    # Resolve internal primary key for this station
    sess = get_session()
    try:
        station = sess.query(Station).filter_by(station_id=station_id_str).one()
        station_pk = station.id
    except NoResultFound:
        # No matching station in DB, skip
        sess.close()
        return []
    finally:
        sess.close()

    # map ts_id → parameter code
    ts2code: Dict[str, str] = {
        str(e["ts_id"]): code
        for code, lst in station_meta["timeseries"].items() if code in CODES
        for e in lst
    }
    rows: List[dict] = []
    ids = list(ts2code.keys())

    for i in range(0, len(ids), CHUNK):
        series = fetch_latest(ids[i : i + CHUNK])
        for s in series:
            code = ts2code.get(str(s["ts_id"]))
            last = extract_last_row(s)
            if not (code and last and last["value"] not in (None, "")):
                continue
            unit = s.get("ts_unitname") or UNITS[code]
            rows.append({
                "timestamp": last["timestamp"],
                "value": float(last["value"]),
                "ts_id": s["ts_id"],
                "station_id": station_pk,
                "parameter_type_name": code,
                "parameter_fullname": FULL[code],
                "unit": unit,
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
        # build a map: external KiWIS ID -> internal stations.id
        ext_to_int = {
            st.station_id: st.id
            for st in s.query(Station).all()
        }

        s.bulk_insert_mappings(TimeseriesData, rows)
        s.commit()

    return len(rows)
