from pathlib import Path
import sys 

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import json
import requests
from flask import Flask, render_template, jsonify, request, abort
from flask_migrate import Migrate
from sqlalchemy import text, bindparam
from .models import Station, TimeSeriesData, TimeSeriesMetadata
from .db import db



BAD_PARAMS = {
    15177: {"TW"},            # Blair WQ         – nonsense water-temp
    15178: {"TW"},            # Below Shand WQ   – nonsense water-temp
    15285: {"TA"},            # Road 32 WQ       – nonsense air-temp
    14434: {"TA"},            # Upper Belwood    – stale air-temp
    14512: {"TA"},            # Armstrong Mills  – stale air-temp
}

def create_app():
    # ─── App setup ───────────────────────────────────────────────────────────
    app = Flask(__name__, static_folder="static", template_folder="templates")
    app.config.from_object("config.settings_example")
    db.init_app(app)
    Migrate(app, db)      # enables `flask db` commands

    # ─── Load our station‐metadata JSON ───────────────────────────────────────
    BASE_DIR = Path(__file__).resolve().parent.parent  
    META_PATH = BASE_DIR / "station_timeseries_metadata.json"
    with open(META_PATH) as f:
        station_meta = json.load(f)
    # metadata keys are strings of the KiWIS station_id
    VALID_STATIONS = set(int(sid) for sid in station_meta.keys())
    print(f"[debug] VALID_STATIONS has {len(VALID_STATIONS)} entries, e.g. {list(VALID_STATIONS)[:5]}")

    # ─── UI route ────────────────────────────────────────────────────────────
    @app.route("/")
    def index():
        return render_template("layout.html")

    # ─── Return only the stations we care about ─────────────────────────────
    @app.route("/api/stations")
    def api_stations():
        url = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
        params = {
            "service":    "kisters",
            "type":       "queryServices",
            "request":    "getStationList",
            "datasource": 0,
            "format":     "geojson",
        }
        resp = requests.get(url, params=params, timeout=20)
        resp.raise_for_status()
        data = resp.json()

        # now filter and annotate each feature with both KiWIS‐ID and our DB‐PK:
        features = []
        for feat in data["features"]:
            props = feat["properties"]
            kiwis_id = int(props["station_id"])
            # look up the Station row whose station_id matches the KiWIS ID
            station = Station.query.filter_by(station_id=str(kiwis_id)).first()
            if not station:
                continue

            # stash both IDs into the feature properties so the client can use either:
            props["kiwis_id"] = kiwis_id
            props["db_id"]    = station.id
            features.append(feat)

        return jsonify({
            "type": "FeatureCollection",
            "features": features
        })

    # ─── Latest readings for a single station ────────────────────────────────
    @app.route("/api/stations/<int:station_id>/latest")
    def station_latest(station_id):
        sql = text("""
                       SELECT DISTINCT ON (ts_id)
                       ts_id, parameter_fullname, value, unit, timestamp
                       FROM timeseries_data
                       WHERE station_id = :sid
                       ORDER BY ts_id, timestamp DESC
                     """)
        
        rows = db.session.execute(sql, {"sid": station_id}).fetchall()
        rows = [r for r in rows
        if r.ts_id not in BAD_PARAMS.get(station_id, set())]
        return jsonify([
            {
                "ts_id": row.ts_id,
                "parameter_fullname": row.parameter_fullname,
                "value": row.value,
                "unit": row.unit,
                "timestamp": row.timestamp.isoformat()
            }
            for row in rows
        ])
    TAB_TEMPLATES = {
      "map": "map_tab.html",
      "cond": "conditions_tab.html",   
      "adv": "advisories_tab.html"     
    }
    @app.route("/tabs/<name>")
    def serve_tab(name):
        tpl = TAB_TEMPLATES.get(name)
        if not tpl:
            abort(404)
        return render_template(tpl)

    @app.route("/api/cluster/latest")
    def cluster_latest():
        ids = request.args.getlist("station_id", type=int)
        if not ids:
            return jsonify([])

        sql = (
            text("""
            SELECT DISTINCT ON (ts.ts_id, s.id)
                s.id            AS station_id,
                ts.ts_id        AS ts_id,
                ts.parameter_fullname,
                ts.value,
                ts.unit,
                ts.timestamp
            FROM timeseries_data ts
            JOIN stations s
            ON ts.station_id = s.station_id    -- note: comparing strings
            WHERE s.id IN :ids                   -- now filtering on the integer PK
            ORDER BY ts.ts_id, s.id, ts.timestamp DESC
            """)
            .bindparams(bindparam("ids", expanding=True))
        )

        rows = db.session.execute(sql, {"ids": ids}).fetchall()
        return jsonify([
            dict(row._mapping) for row in rows
            if row.ts_id not in BAD_PARAMS.get(row.station_id, set())
        ])
    @app.route("/api/dams")
    def api_dams():
        # 1) fetch the same GeoJSON you already have
        url = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
        params = {
            "service": "kisters", "type":"queryServices", "request":"getStationList",
            "datasource":0, "format":"geojson"
        }
        data = requests.get(url, params=params, timeout=20).json()

        # 2) filter to only your DAMs (by your station_type tag)
        dams = []
        for feat in data["features"]:
            props = feat["properties"]
            kiwis_id = int(props["station_id"])
            st = Station.query.filter_by(station_id=str(kiwis_id),
                                        station_type="DAM").first()
            if not st:
                continue
            # pull coords directly from the feature
            lon, lat = feat["geometry"]["coordinates"]
            dams.append({
                "id":      st.id,
                "name":    st.name,
                "lat":     lat,
                "lon":     lon
            })

        return jsonify(dams)

    return app

app = create_app()
