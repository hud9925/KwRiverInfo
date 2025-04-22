import requests 
import pandas as pd
from io import StringIO
import datetime

# Define a one-year time window.
# In this example, we assume data exists from 2024-04-12T00:00:00Z to 2025-04-12T00:00:00Z.
from_date = "2024-04-12T00:00:00Z"
to_date   = "2025-04-12T00:00:00Z"

print("Time range:", from_date, "to", to_date)

# Use a ts_id from the documentation example.
# Note: In practice, you should verify with a getTimeseriesList query that this ts_id has data.
ts_id = '11190042'


base_url = "https://waterdata.grandriver.ca/KiWIS/KiWIS"

params = {
    "kvp": "true",
    "service": "kisters",
    "type": "queryServices",
    "request": "getTimeseriesValues",
    "datasource": "0",
    "format": "csv",
    "ts_id": ts_id,
    "from": from_date,
    "to": to_date,
}

# Optionally print out the full URL for debugging:
request_url = requests.Request("GET", base_url, params=params).prepare().url
print("Request URL:\n", request_url)

response = requests.get(base_url, params=params)

if response.status_code == 200:
    # Write directly to CSV
    with open("timeseries_values_year.csv", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Timeseries data written to 'timeseries_values_year.csv'.")
    
    # Optionally load into pandas for inspection
    df_ts = pd.read_csv(StringIO(response.text), delimiter=';')
    print("First few rows of the timeseries data:")
    print(df_ts.head())
else:
    print("Error retrieving timeseries data, status code:", response.status_code)
    print("Response content:")
    print(response.text)
