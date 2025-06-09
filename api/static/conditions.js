// api/static/conditions.js

// 1) Map of our card IDs → exact DB parameter_fullname
const PARAM_MAP = {
  disc:   'Discharge – River (cms)',
  height: 'Height – River Stage',
  wtemp:  'Temperature – Water',
  air:    'Temperature – Air'
};

// Entry point: load cluster names & init map
async function initConditions() {
  // fetch distinct cluster names directly from Supabase
  const { data: clusters, error: clErr } = await supabase
    .from('station_clusters')
    .select('cluster_name', { distinct: true })
    .order('cluster_name', { ascending: true });

  if (clErr) {
    console.error('Unable to load clusters:', clErr);
    return;
  }

  const sel = document.getElementById('cluster-select');
  sel.innerHTML = clusters
    .map(r => `<option>${r.cluster_name}</option>`)
    .join('');
  sel.addEventListener('change', () => loadCluster(sel.value));

  // Leaflet map setup
  window.ccMap = L.map('cc-map').setView([43.5, -80.5], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
    .addTo(ccMap);

  // Load the first cluster by default
  if (clusters.length) loadCluster(clusters[0].cluster_name);
}

// Main loader: fetch stations, latest metrics, 12 h history, then render
async function loadCluster(clusterName) {
  // 1) get all stations in this cluster
  const { data: stations, error: stErr } = await supabase
    .from('station_clusters')
    .select('station_id, latitude, longitude')
    .eq('cluster_name', clusterName);
  if (stErr) {
    console.error('Stations error:', stErr);
    return;
  }
  const ids = stations.map(s => s.station_id);

  // 2) fetch the most‐recent reading for each parameter
  const latest = {};
  await Promise.all(Object.keys(PARAM_MAP).map(async key => {
    const fullname = PARAM_MAP[key];
    const { data, error } = await supabase
      .from('all_timeseries_data')
      .select('timestamp, value')
      .in('station_id', ids)
      .eq('parameter_fullname', fullname)
      .order('timestamp', { ascending: false })
      .limit(1);

    latest[key] = error
      ? { timestamp: null, value: null }
      : (data[0] || { timestamp: null, value: null });
  }));

  // 3) fetch 12-hour history
  const since = new Date(Date.now() - 12*3600*1000).toISOString();
  const { data: history, error: histErr } = await supabase
    .from('all_timeseries_data')
    .select('parameter_fullname, timestamp, value')
    .in('station_id', ids)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });
  if (histErr) console.error('History error:', histErr);

  // 4) render cards & sparklines
  for (let key in PARAM_MAP) {
    const card = latest[key];
    document.getElementById(`${key}-value`).innerText = 
      card.value != null ? parseFloat(card.value).toFixed(1) : '–';
    document.getElementById(`${key}-ts`).innerText =
      card.timestamp ? new Date(card.timestamp).toLocaleString() : '–';

    const pts = (history || [])
      .filter(h => h.parameter_fullname === PARAM_MAP[key])
      .map(h => parseFloat(h.value));
    drawSparkline(document.getElementById(`spark-${key}`), pts);
  }

  // 5) redraw Leaflet markers
  ccMap.eachLayer(l => l instanceof L.CircleMarker && ccMap.removeLayer(l));
  stations.forEach(s =>
    L.circleMarker([s.latitude, s.longitude], { radius: 6 }).addTo(ccMap)
  );
  const bounds = stations.map(s => [s.latitude, s.longitude]);
  if (bounds.length) ccMap.fitBounds(bounds);
}

// simple canvas-based sparkline
function drawSparkline(canvas, data) {
  const ctx = canvas.getContext('2d'), w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  if (!data.length) return;
  const min = Math.min(...data), max = Math.max(...data);
  ctx.beginPath();
  data.forEach((v,i) => {
    const x = (i/(data.length-1))*w,
          y = h - ((v-min)/((max-min)||1))*h;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();
}

// kick it off
document.addEventListener('DOMContentLoaded', initConditions);
