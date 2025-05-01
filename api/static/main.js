// helper functions

function showLoader(){
  document.getElementById('loading').style.visibility = 'visible';
}
function hideLoader(){
  document.getElementById('loading').style.visibility = 'hidden';
}
function degToCardinal(deg){
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.floor(((deg%360)+360)/45) % 8];
}



/* ---------- static data (reuse your cluster list) ---------- */
const EXCLUDE = [
    "Millbank Climate Station","Dundalk Climate Station","Keldon",
    "Leggatt","Dickie Settlement Road","New Dundee Road","Horner Creek",
    "Canning","Burford Climate Station","Burford Nursery","Mount Vernon",
    "Weber Street","Clair Creek","Erbsville","Mill Creek",
    "Fairchild near Brantford","McKenzie Creek","Sulphur Creek d/s fish ladder",
    "Aberfoyle"
  ];

  const CLUSTERS = {
    "Shades Mills": ["Shades Mills Dam Climate Station"],
    "New Dundee": ["New Dundee Dam"],
    "Upper Grand (Lake Belwood & Above)": [
      "Below Shand WQ Station","Shand Dam Climate Station",
      "Upper Belwood","Marsville","Waldemar"
    ],
    "Upper Grand (North of Sawmill Road)": [
      "Salem","Elora Climate Station","West Montrose"
    ],
    "Mid Grand": [
      "Bridgeport WQ Station","Bridgeport","Victoria(Breslau) Continuous Station"
    ],
    "Mid Grand (Doon to Cambridge)": [
      "Hidden Valley","Doon","Blair WQ Station",
      "Galt","Glen Morris WQ Station"
    ],
    "Lower Grand (Brantford)": [
      "Brant WQ Station","Brant Climate Station","Brantford"
    ],
    "Lower Grand (Below Caledonia)": [
      "York","York WQ Station","Dunnville upstream Weir 3",
      "Byng Island Climate Station","Port Maitland"
    ],
    "Speed River": ["Beaverdale","Road 32 WQ Station","Hanlon WQ Station"],
    "Guelph Lake CA": ["Armstrong Mills","Guelph Lake Dam","Victoria Road"],
    "Eramosa River": ["Eramosa"],
    "Woolwich Reservoir": [
      "Woolwich Dam Climate Station","Floradale"
    ],
    "Conestogo River (North of Conestogo Lake)": ["Upper Drayton","Drayton"],
    "Conestogo River (Conestogo Lake and Downstream)": [
      "Conestogo Dam","Glen Allan","Conestogo Climate Station","St. Jacobs"
    ],
    "Nith River": [
      "New Hamburg","Philipsburg","Baden Climate Station",
      "Nithburg","Wellesley Dam"
    ] };
  
  /* ---------- global bootstrap ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    // preload first tab (Map)
    loadTab('map');
  
    // nav-tab click handler
    document.querySelectorAll('#dash-tabs .nav-link').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        document.querySelectorAll('#dash-tabs .nav-link')
                .forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        loadTab(btn.dataset.tab);
      });
    });
  });
  
  /* ---------- lazy tab loader ---------- */
  async function loadTab(name){
    showLoader();
    try {
      const res  = await fetch(`/tabs/${name}`);
      const html = await res.text();
      document.getElementById('tab-content').innerHTML = html;
      if (name==='map')  initMapTab();
      if (name==='cond') initConditionsTab();
      if (name==='adv')  initAdvisoriesTab();
    } catch(e){
      console.error(e);
    } finally {
      hideLoader();
    }
  }

function showLoader(){ document.getElementById('loading').style.visibility='visible'; }
function hideLoader(){ document.getElementById('loading').style.visibility='hidden'; }


  
  /* ========================================================================
     1.  MAP TAB  – dams only
     ===================================================================== */
  function initMapTab(){
    const map = L.map('map').setView([43.5, -80.5], 9);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                {maxZoom:16}).addTo(map);
  
    fetch('/api/dams')
      .then(r=>r.json())
      .then(dams=>{
        dams.forEach(d=>{
          L.marker([d.lat, d.lon], {
            icon: L.icon({
              iconUrl: '/static/dam.png',  // supply a 18×18 png
              iconSize:[18,18]
            })
          })
          .addTo(map)
          .bindPopup(`<strong>${d.name}</strong>`);
        });
      }).catch(console.error);
  }
  
  /* ========================================================================
     2.  CURRENT CONDITIONS TAB
     ===================================================================== */
  let ccAllFeatures = [];   // will hold all station GeoJSON from /api/stations
  let ccMap;

  function initConditionsTab(){

  // 1) init mini-map once
    if(!ccMap){
      ccMap = L.map('cc-map', { zoomControl:false, attributionControl:false })
                .setView([43.5,-80.5], 9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                  { maxZoom:16 }).addTo(ccMap);
    }

    // 2) fetch & cache station index
    if(ccAllFeatures.length === 0){
      showLoader();
      fetch('/api/stations')
        .then(r=>r.json())
        .then(j=>{
          ccAllFeatures = j.features;
          buildClusterDropdown();
          renderCluster('All');
        })
        .finally(hideLoader);
    } else {
      buildClusterDropdown();
      renderCluster('All');
    }
  }
  
  /* ---- build dropdown ---- */
  function buildClusterDropdown(){
    const sel = document.getElementById('cluster-select');
    sel.innerHTML = `<option value="All">All clusters</option>` +
      Object.keys(CLUSTERS).map(c=>`<option value="${c}">${c}</option>`).join('');
    sel.addEventListener('change', e=> renderCluster(e.target.value));
  }
  
  /* ---- fetch + render table ---- */
  function renderCluster(name){
    const tbody = document.querySelector('#cc-table tbody');
    tbody.innerHTML = '';  // clear old

  // draw mini-map markers
    const subset = name==='All'
      ? ccAllFeatures
      : ccAllFeatures.filter(f=> CLUSTERS[name]?.includes(f.properties.station_name));
    ccMap.eachLayer(l=> l instanceof L.CircleMarker && ccMap.removeLayer(l));
    const pts = subset.map(f=>[f.geometry.coordinates[1],f.geometry.coordinates[0]]);
    pts.forEach(ll=> L.circleMarker(ll,{radius:5}).addTo(ccMap));
    if(pts.length) ccMap.fitBounds(pts);

  // load table data
    const ids = subset.map(f=>f.properties.db_id);
    if(!ids.length){
      tbody.innerHTML = `<tr>
        <td colspan="6" class="text-center text-muted">No stations in this cluster</td>
      </tr>`;
      return;
    }

  showLoader();
  fetch('/api/cluster/latest?' + ids.map(id=>`station_id=${id}`).join('&'))
    .then(r=>r.json())
    .then(rawRows=>{
      // group by ts_id to compute trend
      const byTs = {};
      rawRows.forEach(r=> (byTs[r.ts_id] = byTs[r.ts_id]||[]).push(r));

      const display = [];
      for(const ts in byTs){
        const arr = byTs[ts].sort((a,b)=>new Date(b.timestamp)-new Date(a.timestamp));
        const latest = arr[0];
        const prev   = arr[1]||latest;
        const delta  = latest.value - prev.value;
        // normalize wind direction
        let valDisp = latest.value;
        if(latest.parameter_fullname.includes('Wind – Direction')){
          valDisp = degToCardinal(latest.value);
        } else {
          valDisp = +latest.value.toFixed(1);
        }
        display.push({
          station: latest.station,
          parameter: latest.parameter_fullname,
          latest: valDisp,
          trend:    delta>0?'↑':delta<0?'↓':'→',
          unit:     latest.unit,
          time:     new Date(latest.timestamp).toLocaleString()
        });
      }

      // render rows
      tbody.innerHTML = display.map(r=>`
        <tr>
          <td>${r.station}</td>
          <td>${r.parameter}</td>
          <td>${r.latest}</td>
          <td>${r.trend}</td>
          <td>${r.unit}</td>
          <td>${r.time}</td>
        </tr>
      `).join('');
    })
    .catch(()=> {
      tbody.innerHTML = `<tr>
        <td colspan="6" class="text-center text-danger">Error loading data</td>
      </tr>`;
    })
    .finally(hideLoader);
  }
  
  /* ========================================================================
     3.  ADVISORIES TAB  (stub for later)
     ===================================================================== */
  function initAdvisoriesTab(){
    document.getElementById('tab-content')
            .insertAdjacentHTML('beforeend',
               '<div class="alert alert-info">Advisory view coming soon.</div>');
  }
  