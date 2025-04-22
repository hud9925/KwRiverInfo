import requests
import pandas as pd
from io import StringIO

# Define the station ID for #Glen Allan
# bridgeport WQ monitor station
station_id = "15218"

# Base URL for the KiWIS service
base_url = "https://waterdata.grandriver.ca/KiWIS/KiWIS"

# Prepare request parameters.
# We include station_no, station_id, station_name along with ts_id, ts_name, stationparameter_name, ts_shortname.
params = {
    "kvp": "true",
    "service": "kisters",
    "type": "queryServices",
    "request": "getTimeseriesList",
    "datasource": "0",
    "format": "csv",
    "station_id": station_id,
    "returnfields": "station_no,station_id,station_name,ts_id,ts_name,stationparameter_name,ts_shortname"
}

# Optional: Print the full URL for debugging purposes.
request_url = requests.Request("GET", base_url, params=params).prepare().url
print("Request URL:\n", request_url)

# Make the GET request to retrieve the CSV.
response = requests.get(base_url, params=params)

if response.status_code == 200:
    # Save the CSV output to a file.
    csv_filename = "Conestog_at_glen_allan_timeseries.csv"
    with open(csv_filename, "w", encoding="utf-8") as f:
        f.write(response.text)
    print(f"Timeseries list saved to '{csv_filename}'.")
    
    # Load the CSV into a pandas DataFrame for inspection.
    df_ts = pd.read_csv(StringIO(response.text), delimiter=';')
    print("\nFirst few rows of the timeseries list:")
    print(df_ts.head())
else:
    print("Error retrieving timeseries list, status code:", response.status_code)
    print("Response content:")
    print(response.text)


# url to get ts_id
# https://waterdata.grandriver.ca/KiWIS/KiWIS?kvp=true&service=kisters&type=queryServices&request=getTimeseriesList&datasource=0&format=csv&station_id=YOUR_STATION_ID&returnfields=ts_id,ts_name,stationparameter_name