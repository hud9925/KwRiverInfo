Flask powered web app for visualizing near‑real‑time hydrological data from the Grand River Conservation Authority (GRCA). Users can filter by sub‑basin (Upper Grand, Lower Conestogo, etc.) and view clustered station time‑series on an interactive map


```
KwRiverInfo
├─ .flaskenv
├─ api
│  ├─ app.py
│  ├─ db.py
│  ├─ models.py
│  ├─ Readme.md
│  ├─ routes.py
│  ├─ static
│  │  └─ vendor
│  │     ├─ bootstrap
│  │     │  ├─ css
│  │     │  │  └─ bootstrap.min.css
│  │     │  └─ js
│  │     │     └─ bootstrap.bundle.min.js
│  │     └─ leaflet
│  │        ├─ images
│  │        │  ├─ layers-2x.png
│  │        │  ├─ layers.png
│  │        │  ├─ marker-icon-2x.png
│  │        │  ├─ marker-icon.png
│  │        │  └─ marker-shadow.png
│  │        ├─ leaflet.css
│  │        └─ leaflet.js
│  ├─ templates
│  │  ├─ base.html
│  │  ├─ index.html
│  │  └─ layout.html
│  ├─ __init__.py
│  └─ __pycache__
│     ├─ db.cpython-310.pyc
│     ├─ models.cpython-310.pyc
│     └─ __init__.cpython-310.pyc
├─ api.zip.zip
├─ config
│  ├─ settings.py
│  ├─ __init__.py
│  └─ __pycache__
│     ├─ settings.cpython-310.pyc
│     └─ __init__.cpython-310.pyc
├─ docker-compose.yml
├─ Dockerfile
├─ jobs
│  ├─ hourly_scrape.py
│  ├─ info_getter.py
│  └─ ingest_timeseries.py
├─ jobs.zip
├─ json_filter.py
├─ migrations
│  ├─ alembic.ini
│  ├─ env.py
│  ├─ README
│  ├─ script.py.mako
│  ├─ versions
│  │  ├─ c433b5f3b84c_add_time_series_data_table_with_varchar_.py
│  │  ├─ d16cbf37ad54_add_timeseriesdata.py
│  │  └─ __pycache__
│  │     ├─ c04f51d6f204_add_timeseriesdata_table.cpython-310.pyc
│  │     ├─ c433b5f3b84c_add_time_series_data_table_with_varchar_.cpython-310.pyc
│  │     └─ d16cbf37ad54_add_timeseriesdata.cpython-310.pyc
│  └─ __pycache__
│     └─ env.cpython-310.pyc
├─ README.md
├─ requirements.txt
├─ scraper
│  ├─ client.py
│  ├─ constants.py
│  ├─ loader.py
│  ├─ models.py
│  ├─ __init__.py
│  └─ __pycache__
│     ├─ client.cpython-310.pyc
│     ├─ constants.cpython-310.pyc
│     ├─ loader.cpython-310.pyc
│     ├─ models.cpython-310.pyc
│     └─ __init__.cpython-310.pyc
├─ scripts
│  ├─ data_fetcher.py
│  ├─ data_fetcher_2.py
│  ├─ output
│  ├─ station_file_collector.py
│  ├─ time_series.py
│  ├─ ts_id_determiner.py
│  └─ __pycache__
│     └─ data_fetcher.cpython-310.pyc
├─ scripts.zip
├─ services
│  ├─ fetch_timeseries.py
│  └─ __pycache__
│     └─ fetch_timeseries.cpython-310.pyc
├─ services.zip
├─ test_one.py
└─ __pycache__

```
