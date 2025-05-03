import json, time, datetime
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

from scraper import build_rows_for_station, save_rows

META_FILE = Path(__file__).resolve().parents[1] / "station_timeseries_metadata.json"

def fetch_and_save(sid, meta, cutoff):
    rows = build_rows_for_station(sid, meta)
    # filter out possible outdated scrapped data
    rows = [r for r in rows if datetime.datetime.fromisoformat(r["timestamp"]) >= cutoff]
    if rows:
        saved = save_rows(rows)
        return sid, saved
    return sid, 0

def main():
    stations = json.loads(META_FILE.read_text())
    now = datetime.datetime.now(datetime.timezone.utc)
    cutoff = now - datetime.timedelta(hours=2)

    total = 0
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {
            pool.submit(fetch_and_save, sid, meta, cutoff): sid
            for sid, meta in stations.items()
        }
        for fut in as_completed(futures):
            sid = futures[fut]
            try:
                sid, saved = fut.result()
                print(f"{sid}: inserted {saved} rows")
                total += saved
            except Exception as e:
                print(f"{sid}: failed with {e!r}")

    print(f"==> session complete – {total} rows committed")

if __name__ == "__main__":
    start = time.perf_counter()
    main()
    print(f"Took {time.perf_counter() - start:.2f}s total")
