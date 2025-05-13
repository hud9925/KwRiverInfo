import pandas as pd, numpy as np, hdbscan, sentence_transformers
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline
from sklearn.metrics.pairwise import cosine_distances

# loading stations table
df = pd.read_json('station_timeseries_metadata_json').T
coords = df[['station_name']].copy()
coords['lat'] = df.apply(lambda r: r['geometry']['coordinates'][1], axis=1)
coords['lon'] = df.apply(lambda r: r['geometry']['coordinates'][0], axis=1)

# 2 flatten lat/lon
coords['x'] = np.radians(coords['lon']) * np.cos(np.radians(coords['lat']))
coords['y'] = np.radians(coords['lat'])

# 3 embed names
model = sentence_transformers.SentenceTransformer('paraphrase-MiniLM-L6-v2')
name_vec = model.encode(coords['station_name']
                         .str.replace(r'\b(?:Climate|WQ)\s+Station\b', '', regex=True))

# 4 merge & standardise
X = np.hstack([coords[['x','y']].values, name_vec])
clusterer = make_pipeline(StandardScaler(),
                          hdbscan.HDBSCAN(min_cluster_size=3))
labels = clusterer.fit_predict(X)

coords['cluster'] = labels
coords[['station_name','cluster']].to_json('cluster_map.json', orient='records')
