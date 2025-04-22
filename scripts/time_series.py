import requests, pandas as pd
from io import StringIO

def grca_timeseries(ts_id, period='P7D', fmt='csv'):
    """Return a pandas.DataFrame with GRCA KiWIS data."""
    base = "https://waterdata.grandriver.ca/KiWIS/KiWIS"
    params = {
        "datasource": 0,
        "service": "kisters",
        "type": "queryServices",
        "request": "getTimeseriesValues",
        "ts_id": ts_id,
        "period": period,
        "format": fmt,     # csv is easiest to parse
        "csvdiv": ",",     # GRCA default is semicolon; override
    }
    r = requests.get(base, params=params, timeout=30)
    r.raise_for_status()
    return pd.read_csv(StringIO(r.text))

df = grca_timeseries(8629042, period="P1M")
print(df.head())
