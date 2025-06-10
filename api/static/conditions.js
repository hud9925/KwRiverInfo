// 0) Parameter ↔ exact DB name map
const PARAM_MAP = {
  disc:   'Discharge – River (cms)',
  height: 'Height – River Stage',
  wtemp:  'Temperature – Water',
  air:    'Temperature – Air'
};

const HOURS = 6;
const chartRegistry = {};  

// Utility: draw a 6-hour line chart with axes
function drawChart(key, labels, data, unit) {
  const id = `chart-${key}`, canvas = document.getElementById(id);
  if (!canvas) return;
  if (chartRegistry[id]) chartRegistry[id].destroy();

  const ctx = canvas.getContext('2d');
  chartRegistry[id] = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ label: unit, data, borderColor:'#007bff', fill:false, tension:0.3, pointRadius:2 }] },
    options: {
      responsive: false,
      maintainAspectRatio: false,
      scales: {
        x: { display: true, title: { display: true, text: 'Time' } },
        y: { display: true, title: { display: true, text: unit } }
      },
      plugins: { legend: { display: false } },
      elements: { line: { spanGaps: true } }
    }
  });
}

// Initialize the conditions tab
async function initConditions() {
  const sel = document.getElementById('cluster-select');
  if (!sel) return console.error('Missing selector');

  // 1) fetch + dedupe clusters
  let { data: raw = [], error } = await supabase
    .from('station_clusters')
    .select('cluster_name')
    .order('cluster_name', { ascending: true });
  if (error) return console.error(error);
  const seen = new Set(), clusters = raw
    .map(r => r.cluster_name.trim())
    .filter(n => n && !seen.has(n) && seen.add(n));
  sel.innerHTML = clusters.map(n=>`<option>${n}</option>`).join('');
  sel.onchange = () => loadCluster(sel.value);

  // 2) init map + legend once
  if (!window.ccMap) {
    window.ccMap = L.map('cc-map').setView([43.5,-80.5],9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(ccMap);
    L.control({ position:'bottomright' }).onAdd = ()=>{
      const div=L.DomUtil.create('div','legend');
      div.innerHTML='<i class="legend-box" style="background:blue"></i> Climatic monitoring stations';
      return div;
    };
    L.control.layers().addTo(ccMap);
  }

  // 3) first load
  if (clusters.length) loadCluster(clusters[0]);
}
// helper: ensure ccMap exists and is bound to the current DOM node
function ensureMap() {
  if (window.ccMap && !document.getElementById(window.ccMap.getContainer().id)) {
    window.ccMap.remove();          // old instance tied to old DOM
    window.ccMap = null;
  }
  if (!window.ccMap) {
    window.ccMap = L.map('cc-map').setView([43.5,-80.5],9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(ccMap);
    L.control({ position:'bottomright' }).onAdd = ()=>{
      const div=L.DomUtil.create('div','legend');
      div.innerHTML='<i class="legend-box" style="background:blue"></i> Climatic monitoring stations';
      return div;
    };
    L.control.layers().addTo(ccMap);
  }
}

// Load data + render for one cluster
async function loadCluster(clusterName) {
   ensureMap();
  // a) get stations + coords
  let { data: stations = [], error } = await supabase
    .from('station_clusters_geo')
    .select('station_id,latitude,longitude')
    .eq('cluster_name', clusterName);
  if (error) return console.error(error);
  const ids = stations.map(s=>s.station_id);

  // b) fetch last-two readings for arrows
  const latest = {};
  await Promise.all(Object.entries(PARAM_MAP).map(async ([key,name])=>{
    const { data = [] } = await supabase
      .from('all_timeseries_data')
      .select('value,timestamp')
      .in('station_id',ids)
      .eq('parameter_fullname',name)
      .order('timestamp',{ascending:false})
      .limit(2);
    latest[key] = data;
  }));

  // c) render cards + charts
  for (let [key,name] of Object.entries(PARAM_MAP)) {
    const [cur={},prev={}] = latest[key] || [];
    const cv = cur.value ?? null, pv = prev.value ?? cv;
    const delta = cv!=null && pv!=null ? cv - pv : 0;
    const arrow = delta >  0.01 ? '▲'
                : delta < -0.01 ? '▼'
                :                 '—';

    // update value & arrow
    const valEl = document.getElementById(`${key}-value`);
    const arrEl = document.getElementById(`${key}-arrow`);
    const tsEl  = document.getElementById(`${key}-ts`);
    if (valEl) valEl.innerText = cv!=null?cv.toFixed(1):'–';
    if (arrEl) {
      const cls = arrow==='▲' ? 'badge bg-success'
                : arrow==='▼' ? 'badge bg-danger'
                : 'badge bg-light text-dark';
      arrEl.className = cls;
      arrEl.innerText = arrow;
      }
    if (tsEl)  tsEl.innerText = cur.timestamp
                   ? new Date(cur.timestamp).toLocaleTimeString()
                   : '–';

    // color‐code discharge
    if (key==='disc' && valEl) {
      valEl.style.color = cv>=20?'red':cv>=10?'goldenrod':'green';
    }

    // get 6h history
    const since = new Date(Date.now()-HOURS*3600*1000).toISOString();
    const { data: hist = [] } = await supabase
      .from('all_timeseries_data')
      .select('timestamp,value')
      .in('station_id',ids)
      .eq('parameter_fullname', name)
      .gte('timestamp', since)
      .order('timestamp',{ascending:true});

    const labels = hist.map(h=>new Date(h.timestamp).toLocaleTimeString());
    const values = hist.map(h=>+h.value);
    const unit   = key==='disc'? 'm³/s' : key==='height'? 'm' : '°C';
    drawChart(key, labels, values, unit);
  }

  // d) redraw map markers
  window.ccMap.eachLayer(l => l instanceof L.CircleMarker && ccMap.removeLayer(l));
  stations.forEach(s => {
    L.circleMarker([s.latitude, s.longitude],{radius:5}).addTo(ccMap);
  });
  const pts = stations.map(s=>[s.latitude,s.longitude]);
  if(pts.length) ccMap.fitBounds(pts);
}

window.initConditions = initConditions;
window.loadCluster    = loadCluster;