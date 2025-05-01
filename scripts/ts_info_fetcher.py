"""
Fetch the latest GRCA KiWIS value for HG, QR, TA, TW, UD, US
and write one CSV per station.

Requires: pandas, requests  (pip install pandas requests)
"""

from zoneinfo import ZoneInfo
from datetime import datetime
import os, json, time, requests, pandas as pd

# ─── constants ──────────────────────────────────────────────────────────
BASE   = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
CODES  = {"HG", "QR", "TA", "TW", "UD", "US"}
FULL   = {
    "HG": "Height – River Stage",   "QR": "Discharge – River (cms)",
    "TA": "Temperature – Air",      "TW": "Temperature – Water",
    "UD": "Wind – Direction",       "US": "Wind – Speed",
}
UNITS  = dict(HG="m", QR="m³/s", TA="°C", TW="°C", UD="°", US="m/s")

CHUNK      = 3                 # ts_ids per KiWIS call
OUTDIR     = "output_csvs"
PAUSE_S    = 0.6              
TIMEZONE   = "America/Toronto" # ask KiWIS to return local timestamps

# when I was coding this, I was in Japan, so no requests were returned till I changed to ETC
os.makedirs(OUTDIR, exist_ok=True)


# establish 

# ─── helpers ────────────────────────────────────────────────────────────
def fetch_latest(ts_ids):
    """Return list of series dicts (latest value only) for given ids."""
    params = {
        "datasource": 0,
        "service":    "kisters",
        "type":       "queryServices",
        "request":    "getTimeseriesValues",
        "format":     "dajson",
        "timezone":   TIMEZONE,
        "ts_id":      ",".join(ts_ids),
    }
    r = requests.get(BASE, params=params, timeout=20)
    r.raise_for_status()
    return r.json()

def extract_last_row(series_obj):
    """
    Handle both 'values' (current KiWIS) and 'data' (older KiWIS).
    Returns a dict with ts_id/timestamp/value or None if empty.
    """
    rows = series_obj.get("values") or series_obj.get("data") or []
    if not rows:
        return None
    ts, val, *_ = rows[-1]  # last element = newest
    return {"timestamp": ts, "value": val}

# ─── load station map ───────────────────────────────────────────────────
with open("station_timeseries_metadata.json") as f:
    stations = json.load(f)

# ─── main loop ──────────────────────────────────────────────────────────
for sid, meta in stations.items():
    # map ts_id → parameter code (HG, QR, …) for desired parameters only
    ts2code = {str(e["ts_id"]): code
               for code, lst in meta["timeseries"].items() if code in CODES
               for e in lst}
    if not ts2code:
        continue  # nothing we care about at this station

    rows, ids = [], list(ts2code.keys())

    for i in range(0, len(ids), CHUNK):
        try:
            data = fetch_latest(ids[i:i+CHUNK])
        except Exception as exc:
            print(f"[{sid}] {ids[i:i+CHUNK]} → {exc}")
            continue

        for s in data:
            code = ts2code.get(str(s["ts_id"]))
            if code not in CODES:
                continue
            last = extract_last_row(s)
            if last is None:           # no actual reading
                continue

            rows.append({
                **last,
                "ts_id":              s["ts_id"],
                "parametertype_name": code,
                "unit":               s.get("ts_unitname") or UNITS[code],
                "parameter_fullname": FULL[code],
                "station_id":         sid,
            })
        time.sleep(PAUSE_S)

    if rows:
        pd.DataFrame(rows).to_csv(
            os.path.join(OUTDIR, f"station_{sid}.csv"), index=False)
        print(f"[{sid}] {len(rows)} rows → {OUTDIR}/station_{sid}.csv")
    else:
        print(f"[{sid}] no desired parameters reported yet")

print("Done:", datetime.now(ZoneInfo(TIMEZONE)).strftime("%Y-%m-%d %H:%M:%S"))
