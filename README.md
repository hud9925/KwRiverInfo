
# Grand River Data Explorer

Web app for visualizing hydrological data from the Grand River Conservation Authority (GRCA). Users can filter by sub-basin (Upper Grand, Lower Conestogo, etc.) in Central South-Western Ontario (centered around KW Region) and explore clustered station time-series on an interactive map. Mainly for anglers and boaters

## Live Demo

The app is currently deployed at  
👉 https://kw-river-info.vercel.app/  
and serves up-to-the-minute station metadata and charts directly from the KiWIS API.


## Overview

- **Interactive Map**: A Leaflet-powered map showing clusters of river, reservoir, climate and water-quality stations across the Grand River watershed.
- **Time-Series Endpoints**: Flask REST endpoints that proxy KiWIS timeseries calls (discharge, stage, temperature, turbidity, etc.) with URL parameters like `?period=P1D`.

## Current Build (a bit buggy)
- **See locations of dams operated by GRCA
- **See Climatic Conditions of Clusters (not updated hourly yet)

## Coming Soon...
-**access points 
-**Plots for climatic conditions

