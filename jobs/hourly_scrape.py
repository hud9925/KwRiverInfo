"""
scraper called hourly via cron or APScheduler.
"""
import json
import time
from pathlib import Path

from scraper import build_rows_for_station, save_rows
from scraper.constants import THROTTLE_S

META_FILE = Path(__file__).resolve().parents[1] / "station_timeseries_metadata.json"

def main():
    stations = json.loads(META_FILE.read_text())

    total = 0
    for sid, meta in stations.items():
        rows = build_rows_for_station(sid, meta)
        if rows:
            saved = save_rows(rows)
            total += saved
            print(f"{sid}: inserted {saved} rows")
        time.sleep(THROTTLE_S)  # extra politeness between stations

    print(f"==> session complete – {total} rows committed")

if __name__ == "__main__":
    main()