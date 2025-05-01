
import os, sys
sys.path.insert(0, os.path.abspath(os.path.join(__file__, os.pardir)))


from api.app import create_app
from api.db import db
from api.models import Station
app = create_app()

with app.app_context():
    client = app.test_client()
    resp = client.get('/api/stations')
    if resp.status_code != 200:
        raise RuntimeError(f"/api/stations failed with {resp.status_code}")
    features = resp.get_json().get('features', [])

    updated = 0
    for feat in features:
        sid = feat['properties']['db_id']
        lon, lat = feat['geometry']['coordinates']
        if lat is None or lon is None:
            continue
        st = Station.query.get(sid)
        if st:
            st.latitude  = lat
            st.longitude = lon
            db.session.add(st)
            updated += 1

    db.session.commit()
    print(f"✅ Updated {updated} stations with lat/lon")
