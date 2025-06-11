# GRCA River Info Dashboard

A real-time web dashboard for monitoring water and meteorological conditions across the Grand River watershed, developed for the Grand River Conservation Authority (GRCA).

![GRCA Dashboard](https://www.grcariverinfo.com)

## Features

* **Interactive Map** of GRCA dams and public river-access points with driving directions links
* **Current Conditions** by cluster:

  * Water Discharge (m³/s) with color-coded thresholds and directional trend
  * River Height (m), Water Temperature (°C), Air Temperature (°C) with trend arrows
  * 6-hour time series charts with axis labels
*  layout using Bootstrap 5
* **Leaflet.js** for mapping and marker clustering
* **Chart.js** for time-series charts
* **Supabase** as the backend database for station metadata and time-series data
* **Flask API** serving data endpoints and server-rendered templates

## Tech Stack

* **Frontend:** HTML5, Bootstrap 5, Leaflet.js, Chart.js, vanilla JavaScript (ES6)
* **Backend:** Python 3, Flask, SQLAlchemy
* **Database:** Supabase (PostgreSQL)
* **Deployment:** Vercel (frontend)

## Prerequisites

* Python 3.9+
* Node.js (for any local bundling, if required)
* Supabase account with the following tables/views:

  * `station_clusters` (cluster names, station IDs)
  * `station_clusters_geo` (cluster, station, latitude, longitude)
  * `all_timeseries_data` (union view of historical & current timeseries)
* `.env` file with:

```ini
SQLALCHEMY_DATABASE_URI=postgresql://<user>:<pass>@<host>:5432/<db>
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-org/kwfishing.git
   cd kwfishing
   ```

2. **Create a virtual environment & install dependencies**

   ```bash
   python -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Create `.env`**

   ```bash
   cp settings_example.env .env
   # then edit .env with your credentials
   ```

4. **Initialize the database** (if hosting locally)

   ```bash
   flask db upgrade
   # optionally: flask db migrate
   ```

5. **Run the development server**

   ```bash
   flask run
   ```

   Access at `http://127.0.0.1:5000`

## File Structure

```
kwfishing/
├── api/                  # Flask backend
│   ├── app.py            # App factory & routes
│   ├── models.py         # SQLAlchemy models
│   ├── db.py             # DB initialization
│   └── config/           # Configuration modules
│       └── settings_example.py
├── static/               # Frontend assets
│   ├── dam.png
│   ├── access.png
│   ├── main.js
│   ├── conditions.js
│   ├── dams.js
│   └── vendor/           # Bootstrap, Leaflet, etc.
├── templates/
│   ├── layout.html       # Main SPA shell
│   └── partials/         # Tab fragments
│       ├── map_fragment.html
│       └── conditions_fragment.html
├── requirements.txt
└── README.md             # <-- this file
```

## Deployment

* **Frontend**: deploy `templates/layout.html` + `static/` to Vercel or any static host.
* **Backend**: deploy `api/` to Heroku, Fly.io, or similar.
* Ensure environment variables are set and CORS or proxy settings allow `/api/*` calls.

## Usage

1. **Map Tab**: Explore dam locations (♦) and river-access points. Use layer controls to toggle visibility.
2. **Current Conditions**: Select a cluster from the dropdown to view real-time data and trends.

## Contributing

* Fork the repo & create feature branches.

---

*This dashboard uses provisional GRCA data. For official reviewed data, please refer to the GRCA website.*
