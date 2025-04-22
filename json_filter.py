import json

# Paths
input_path = 'station_timeseries_metadata_og.json'
output_path = 'station_timeseries_metadata_og_filtered.json'

# Load original JSON
with open(input_path, 'r') as f:
    data = json.load(f)

# List of station IDs to remove (keys)
keys_to_remove = [
    "14698", "15074", "15051", "15056", "41576", "41578", "14554", "14861",
    "35980", "14624", "14561", "14493", "15012", "15007", "14575", "14867",
    "17772", "14569", "14795"
]

# Remove specified stations
for key in keys_to_remove:
    data.pop(key, None)

# Save updated JSON
with open(output_path, 'w') as f:
    json.dump(data, f, indent=4)

# Inform user
output_path
