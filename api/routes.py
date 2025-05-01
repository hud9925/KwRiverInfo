# api/routes.py
from flask import Blueprint, jsonify
from sqlalchemy import distinct, desc
from scraper.models import get_session, TimeseriesData, TimeseriesMetadata

bp = Blueprint("stations", __name__, url_prefix="/api/stations")

@bp.route("/<int:station_pk>/latest", methods=["GET"])
def latest_readings(station_pk):
    sess = get_session()
    # This uses DISTINCT ON to pull the newest row per ts_id:
    q = (
      sess.query(TimeseriesData)
          .filter(TimeseriesData.station_id == station_pk)
          .order_by(TimeseriesData.ts_id, desc(TimeseriesData.timestamp))
          .distinct(TimeseriesData.ts_id)
    )
    out = [
      {
        "ts_id": row.ts_id,
        "param": row.parameter_fullname,
        "value": row.value,
        "unit": row.unit,
        "when": row.timestamp.isoformat()
      }
      for row in q
    ]
    sess.close()
    return jsonify(out)
