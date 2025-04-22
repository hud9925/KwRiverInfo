import requests
import pandas as pd
from io import StringIO
import time
import json

# Since each station monitors different kinds of data (e.g water temperature, water turbidity, etc), we will keep track of the metadata each station contains

# Load the list of all monitoring stations (all_stations.csv)
# The CSV file is expected to have at least these columns: station_id, station_name, station_latitude, station_longitude, etc.
all_stations = pd.read_csv("all_stations.csv", delimiter=';')

# This dictionary will store the timeseries metadata for each station.
# The structure will be:
# {
#    station_id: {
#         "station_name": ...,
#         "timeseries": {
#              "PARAM_CODE": [ { "ts_id": ..., "ts_name": ..., "ts_shortname": ... }, ... ],
#              ...
#         }
#    },
#    ...
# }
station_ts_dict = {}

# Base URL for the KiWIS service
base_url = "https://waterdata.grandriver.ca/KiWIS/KiWIS"

# Base parameters for the getTimeseriesList query.
base_params = {
    "kvp": "true",
    "service": "kisters",
    "type": "queryServices",
    "request": "getTimeseriesList",
    "datasource": "0",
    "format": "csv",
    # We'll set station_id in the loop.
    # We want to return some useful fields from getTimeseriesList:
    "returnfields": "station_id,station_no,station_name,ts_id,ts_name,stationparameter_name,ts_shortname"
}

print("Processing timeseries metadata for each station...")
# Loop through all stations
for idx, row in all_stations.iterrows():
    station_id = str(row["station_id"])
    station_name = row["station_name"]
    
    # Copy base parameters and add station_id
    params = base_params.copy()
    params["station_id"] = station_id
    
    try:
        response = requests.get(base_url, params=params)
        if response.status_code == 200:
            # Read the returned CSV (which uses semicolons as delimiters)
            ts_df = pd.read_csv(StringIO(response.text), delimiter=';')
            
            # Create a dictionary for this station's timeseries:
            ts_info = {}
            # Loop over each row in the timeseries DataFrame
            for index, ts_row in ts_df.iterrows():
                # Extract the parameter code, which is provided in the stationparameter_name field.
                param_code = ts_row.get("stationparameter_name")
                ts_entry = {
                    "ts_id": ts_row.get("ts_id"),
                    "ts_name": ts_row.get("ts_name"),
                    "ts_shortname": ts_row.get("ts_shortname")
                }
                # Append this entry to the list for this parameter; if it doesn't exist, create a new list.
                if param_code:
                    if param_code in ts_info:
                        ts_info[param_code].append(ts_entry)
                    else:
                        ts_info[param_code] = [ts_entry]
            # Record the station's name and its timeseries info.
            station_ts_dict[station_id] = {
                "station_name": station_name,
                "timeseries": ts_info
            }
            print(f"Processed station {station_name} (ID: {station_id}).")
        else:
            print(f"Error for station {station_name} (ID: {station_id}): HTTP {response.status_code}")
    except Exception as e:
        print(f"Exception for station {station_name} (ID: {station_id}): {e}")
        
    # Pause briefly between requests to avoid overloading the server.
    time.sleep(0.5)

# Save the compiled metadata to a JSON file for further reference.
with open("station_timeseries_metadata.json", "w", encoding="utf-8") as f:
    json.dump(station_ts_dict, f, indent=4)

print("All station timeseries metadata saved to 'station_timeseries_metadata.json'.")
