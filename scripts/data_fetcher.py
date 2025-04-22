import requests
import pandas as pd
from io import StringIO

# Base URL for the KiWIS service
base_url = "https://waterdata.grandriver.ca/KiWIS/KiWIS"

# Set the query parameters to retrieve all stations with station_id, station_name, station_latitude, and station_longitude.
params = {
    "kvp": "true",
    "service": "kisters",
    "type": "queryServices",
    "request": "getStationList",
    "datasource": "0",
    "format": "csv",
    "returnfields": "station_id,station_name,station_latitude,station_longitude"
}

def load_station_list(path: str) -> pd.DataFrame:
    # for example:
    return pd.read_csv(path + ".csv", delimiter=";")

# Optional: print the full request URL for debugging.
request_url = requests.Request("GET", base_url, params=params).prepare().url
print("Request URL:\n", request_url)

# Execute the GET request.
response = requests.get(base_url, params=params)

if response.status_code == 200:
    # Save the CSV output to a file.
    with open("all_stations.csv", "w", encoding="utf-8") as f:
        f.write(response.text)
    print("Station list saved to 'all_stations.csv'.")
    
    # Load the CSV into a pandas DataFrame for inspection,
    # using semicolon (;) as the delimiter.
    df = pd.read_csv(StringIO(response.text), delimiter=';')
    print("First few rows of the station list:")
    print(df.head())
else:
    print("Error retrieving station list, status code:", response.status_code)
    print("Response content:")
    print(response.text)
