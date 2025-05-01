# tests the data retrieval of one station
from pathlib import Path, PurePosixPath
import json, pprint

from scraper import build_rows_for_station, save_rows

meta = json.loads(Path("station_timeseries_metadata.json").read_text())

# testing Conestogo
sid  = "14908"
rows = build_rows_for_station(sid, meta[sid])

pprint.pp(f"Fetched {len(rows)} rows")
if rows:
    save_rows(rows)
    pprint.pp("✓ rows committed to DB")
