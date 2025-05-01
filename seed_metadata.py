# seeding the database for the first time
import json
from sqlalchemy import delete
from scraper.models import (
    Station,
    TimeseriesMetadata,
    TimeseriesData,
    get_session,
    engine,
    Base,
)

# 0) make sure your tables exist
Base.metadata.create_all(engine)
sess = get_session()

# 1) delete any existing time-series rows first (FK → metadata)
sess.execute(delete(TimeseriesData))

# 2) then delete metadata (FK → stations)
sess.execute(delete(TimeseriesMetadata))

# 3) then delete stations
sess.execute(delete(Station))

sess.commit()

# 4) now re-load everything from the JSON
with open("station_timeseries_metadata.json") as f:
    station_meta = json.load(f)

for sid, meta in station_meta.items():
    # insert station
    st = Station(
        station_id=sid,
        name=meta.get("station_name"),
        latitude=meta.get("latitude"),
        longitude=meta.get("longitude"),
    )
    sess.add(st)
    sess.flush()  # so st.id is populated

    # insert the timeseries metadata
    for code, lst in meta["timeseries"].items():
        for ts in lst:
            sess.add(
                TimeseriesMetadata(
                    ts_id=ts["ts_id"],
                    station_id=st.id,
                    ts_path=ts.get("ts_name"),
                    ts_name=ts.get("ts_name"),
                    ts_shortname=ts.get("ts_shortname"),
                    parametertype_id=code,
                    parametertype_name=code,
                )
            )

sess.commit()
print("Done seeding stations + metadata!")
