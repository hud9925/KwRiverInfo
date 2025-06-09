// api/static/conditions.js

const PARAM_MAP = {
  disc:   'Discharge – River (cms)',
  height: 'Height – River Stage',
  wtemp:  'Temperature – Water',
  air:    'Temperature – Air'
};

async function initConditions() {
  // 1) Grab *all* cluster_name rows, in order
  const { data: raw, error } = await supabase
    .from('station_clusters')
    .select('cluster_name')
    .order('cluster_name', { ascending: true });

  if (error) {
    console.error("Error loading clusters:", error);
    return;
  }

  // 2) Normalize & dedupe
  //    - trim whitespace
  //    - keep only the first appearance of each name
  const seen = new Set();
  const clusters = raw
    .map(r => r.cluster_name.trim())
    .filter(name => {
      if (seen.has(name)) return false;
      seen.add(name);
      return true;
    });

  // 3) Populate the <select>
  const sel = document.getElementById('cluster-select');
  sel.innerHTML = clusters
    .map(name => `<option value="${name}">${name}</option>`)
    .join('');
  sel.onchange = () => loadCluster(sel.value);

  // 4) Init the map (only once)
  if (!window.ccMap) {
    window.ccMap = L.map('cc-map').setView([43.5, -80.5], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png')
      .addTo(ccMap);
  }

  // 5) Auto‐load the first cluster
  if (clusters.length) {
    loadCluster(clusters[0]);
  }
}


async function loadCluster(clusterName) {
  const { data: stations, error: e1 } = await supabase
    .from('station_clusters_geo')        // ← use the new view
    .select('station_id, latitude, longitude')
    .eq('cluster_name', clusterName);
  if (e1) return console.error(e1);

  const ids = stations.map(s => s.station_id);

  // latest readings
  const latest = {};
  await Promise.all(Object.keys(PARAM_MAP).map(async key => {
    const fullname = PARAM_MAP[key];
    const { data, error } = await supabase
      .from('all_timeseries_data')
      .select('timestamp,value')
      .in('station_id', ids)
      .eq('parameter_fullname', fullname)
      .order('timestamp', { ascending: false })
      .limit(1);
    latest[key] = error ? { timestamp:null,value:null } : (data[0] || { timestamp:null,value:null });
  }));

  // 12-hour history
  const since = new Date(Date.now() - 12*3600*1000).toISOString();
  const { data: history, error: e2 } = await supabase
    .from('all_timeseries_data')
    .select('parameter_fullname,timestamp,value')
    .in('station_id', ids)
    .gte('timestamp', since)
    .order('timestamp', { ascending: true });
  if (e2) console.error(e2);

  // render cards + sparklines
  for (let key in PARAM_MAP) {
    const card = latest[key];
    document.getElementById(`${key}-value`).innerText =
      card.value != null ? card.value.toFixed(1) : '–';
    document.getElementById(`${key}-ts`).innerText =
      card.timestamp ? new Date(card.timestamp).toLocaleString() : '–';

    const pts = (history||[])
      .filter(h => h.parameter_fullname===PARAM_MAP[key])
      .map(h => +h.value);
    drawSparkline(document.getElementById(`spark-${key}`), pts);
  }

  // redraw map markers
  ccMap.eachLayer(l => l instanceof L.CircleMarker && ccMap.removeLayer(l));
  stations.forEach(s =>
    L.circleMarker([s.latitude, s.longitude], { radius: 6 }).addTo(ccMap)
  );
  const bounds = stations.map(s => [s.latitude, s.longitude]);
  if (bounds.length) ccMap.fitBounds(bounds);
}

function drawSparkline(canvas, data) {
  const ctx = canvas.getContext('2d'), w=canvas.width, h=canvas.height;
  ctx.clearRect(0,0,w,h);
  if (!data.length) return;
  const min=Math.min(...data), max=Math.max(...data);
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x = (i/(data.length-1))*w,
          y = h - ((v-min)/((max-min)||1))*h;
    i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
  });
  ctx.stroke();
}

// document.addEventListener('DOMContentLoaded', initConditions);
