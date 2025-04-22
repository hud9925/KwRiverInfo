from flask import Flask, render_template, jsonify
import requests, json, os

app = Flask(__name__)


HERE = os.path.dirname(__file__)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/stations")
def api_stations():
    """
    Proxy KiWIS getStationList as GeoJSON.
    """
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
    return jsonify(resp.json())

if __name__ == "__main__":
    app.run(debug=True)
