// helper functions
const showLoader = () => document.getElementById('loading').style.visibility = 'visible';
const hideLoader = () => document.getElementById('loading').style.visibility = 'hidden';
const degToCardinal = deg => {
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  return dirs[Math.floor(((deg%360)+360)/45) % 8];
};



/* ---------- static clusters ---------- */
const EXCLUDE = [
    "Millbank Climate Station","Dundalk Climate Station","Keldon",
    "Leggatt","Dickie Settlement Road","New Dundee Road","Horner Creek",
    "Canning","Burford Climate Station","Burford Nursery","Mount Vernon",
    "Weber Street","Clair Creek","Erbsville","Mill Creek",
    "Fairchild near Brantford","McKenzie Creek","Sulphur Creek d/s fish ladder",
    "Aberfoyle"
  ];

const ACCESS_POINTS = [
  { name: "Three Bridges Dam",    lat: 43.5359583, lon: -80.5723538 },
  { name: "Wilson’s Flats #4",     lat: 43.624831,   lon: -80.4494333 },
  { name: "Grand River AP #7",     lat: 43.5417639,  lon: -80.4965949 },
  { name: "Moyer’s Blair Landing", lat: 43.3855658,  lon: -80.3853637 },
  { name: "River’s Bluffs Park",   lat: 43.3708315,  lon: -80.3237178 },
  { name: "Rail Trail Parking Lot",lat: 43.345944,   lon: -80.314889 }, 
  { name: "Eric Thomlinson Ramp",  lat: 43.2765009,  lon: -80.3481151 },
  { name: "Penman’s Dam",          lat: 43.1970663,  lon: -80.3828296 },
  { name: "Bean Park",                   lat: 43.1817994,   lon: -80.3722872 },
  { name: "Cockshutt Bridge",            lat: 43.1104507,   lon: -80.2453403 },
  { name: "Gilkison Flats",              lat: 43.1208596,   lon: -80.2680613 },
  { name: "Caledonia Kinsmen Park",      lat: 43.0739608,   lon: -79.9560741 },
  { name: "York Park",                   lat: 43.0207607,    lon: -79.9329564 },
  { name: "Bob Baigent Memorial Park",   lat: 42.9481751,   lon: -79.8635429 },
  { name: "Snyder's Flats Conservation Area", lat: 43.5099088,   lon: -80.4883833},
  {name: "Columbia Lake",               lat: 43.472774, lon: -80.5595417}
]


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
  
    // ─── Tab boilerplate ────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    loadTab('map');
    document.querySelectorAll('#dash-tabs .nav-link')
      .forEach(btn => btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        document.querySelectorAll('#dash-tabs .nav-link').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
        loadTab(btn.dataset.tab);
      }));
  });

  async function loadTab(name) {
  showLoader();
  const html = await fetch(`/tabs/${name}`).then(r=>r.text());
  document.getElementById('tab-content').innerHTML = html;
  if (name === 'map') initMapTab();
  else if (name === 'cond')  initConditions();
  else if (name === 'adv') initAdvisoriesTab();
  hideLoader();
}


  
  /* ========================================================================
     1.  MAP TAB  
     ===================================================================== */
  let damMap;  // hold our Leaflet instance
function initMapTab() {
  // 1) If an old map exists (bound to a removed DOM node), destroy it
  if (damMap) {
    damMap.remove();
    damMap = null;
  }

  // 2) Re-create the map in your new #main-map container
  damMap = L.map('main-map').setView([43.5, -80.5], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16
  }).addTo(damMap);

  // 3) Prepare icons
  const damIcon = L.icon({
    iconUrl: '/static/dam.png',
    iconSize:   [28,28],
    iconAnchor: [14,28],
    popupAnchor:[0,-24]
  });
  const apIcon = L.icon({
    iconUrl: '/static/access.png',
    iconSize:   [24,24],
    iconAnchor: [12,24],
    popupAnchor:[0,-20]
  });

  // 4) Create layer groups
  const damLayer    = L.layerGroup().addTo(damMap);
  const accessLayer = L.layerGroup().addTo(damMap);

  // 5) Plot your **static** dams list (window.STATIC_DAMS)
  window.STATIC_DAMS.forEach(d => {
    L.marker([d.lat, d.lon], { icon: damIcon })
      .addTo(damLayer)
      .bindPopup(`
        <strong>${d.name}</strong><br>
        <a href="https://www.google.com/maps?q=${d.lat},${d.lon}" target="_blank">
          Get directions
        </a>
      `);
  });

  // 6) Plot your ACCESS_POINTS list
  const DAM_NAMES = new Set([ "Three Bridges Dam", "Penman’s Dam" ]);
  ACCESS_POINTS.forEach(pt => {
    const isDam = DAM_NAMES.has(pt.name);
    L.marker([pt.lat, pt.lon], { icon: isDam ? damIcon : apIcon })
      .addTo(isDam ? damLayer : accessLayer)
      .bindPopup(`
        <strong>${pt.name}</strong><br>
        <a href="https://www.google.com/maps?q=${pt.lat},${pt.lon}" target="_blank">
          Get directions
        </a>
      `);
  });

  // 7) Layer control toggle
  L.control
    .layers(null, { "Dams": damLayer, "Access Points": accessLayer }, { collapsed: false })
    .addTo(damMap);

  // 8) Fit map to show all markers
  const allMarkers = L.featureGroup([
    ...damLayer.getLayers(),
    ...accessLayer.getLayers()
  ]);
  if (allMarkers.getLayers().length) {
    damMap.fitBounds(allMarkers.getBounds().pad(0.1));
  }
}





     //   function initMapTab() {
//   const map = L.map('map').setView([43.5,-80.5],9);
//   L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:16}).addTo(map);
 

//   const damIcon = L.icon({
//     iconUrl: '/static/dam.png',
//     iconSize: [28, 28],      // up from [18,18]
//     iconAnchor: [14, 28],
//     popupAnchor: [0, -24]
//   });

//   const apIcon = L.icon({
//     iconUrl: '/static/access.png', // put your access‐point icon here
//     iconSize: [24,24],
//     iconAnchor: [12,24],
//     popupAnchor: [0, -20]
//   });

//   const damLayer = L.layerGroup().addTo(map);
//   const accessLayer = L.layerGroup().addTo(map);


//   fetch('/api/dams')
//   .then(r=>r.json())
//   .then(dams => {
//     dams.forEach(d => {
//       L.marker([d.lat, d.lon], { icon: damIcon })
//         .addTo(damLayer)
//         .bindPopup(`<strong>${d.name}</strong><br>
//                     <a href="https://www.google.com/maps?q=${d.lat},${d.lon}"
//                        target="_blank">Get directions</a>`);
//     });
//   });
//     // additional dams that were not in the KiWIS API
//     const DAM_NAMES = new Set([
//       "Three Bridges Dam",
//       "Penman’s Dam"
//     ]);
//     // access point layer

//     ACCESS_POINTS.forEach(pt => {
//   // choose layer based on whether this point is actually a dam
//   const targetLayer = DAM_NAMES.has(pt.name)
//     ? damLayer
//     : accessLayer;

//   L.marker([pt.lat, pt.lon], {
//     icon: DAM_NAMES.has(pt.name) ? damIcon : apIcon
//   })
//   .addTo(targetLayer)
//   .bindPopup(`
//     <strong>${pt.name}</strong><br>
//     <a href="https://www.google.com/maps?q=${pt.lat},${pt.lon}" target="_blank">
//       Get directions
//     </a>
//   `);
//     });
//     // ACCESS_POINTS.forEach(pt => {
    
//     //   const m = L.marker([pt.lat, pt.lon], { icon: apIcon })
//     //   .bindPopup(`
//     //     <strong>${pt.name}</strong><br>
//     //     <a href="https://www.google.com/maps?q=${pt.lat},${pt.lon}"
//     //        target="_blank">Get directions</a>
//     //   `);
//     // accessLayer.addLayer(m);
//     // });

//       // 5) add a layer‐control in the top‐right
//     L.control.layers(
//       null,
//       { 
//         "Dams": damLayer,
//         "Access Points": accessLayer
//       },
//       { collapsed: false }
//     ).addTo(map);

//     // 6) fit to show everything
//     const all = L.featureGroup([ damLayer, accessLayer ]);

    

//     map.fitBounds(all.getBounds().pad(0.1));

// }
  
  /* ========================================================================
    //  2.  CURRENT CONDITIONS TAB
    //  ===================================================================== */
    // let ccAllFeatures = [], ccMap;

    // function initConditionsTab() {
    //   if (!ccMap) {
    //     ccMap = L.map('cc-map', { zoomControl: false, attributionControl: false })
    //               .setView([43.5, -80.5], 9);
    //     L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 16 })
    //       .addTo(ccMap);
    //   }

    //   if (ccAllFeatures.length === 0) {
    //     showLoader();
    //     fetch('/api/stations')
    //       .then(r => r.json())
    //       .then(j => ccAllFeatures = j.features)
    //       .finally(() => {
    //         buildClusterDropdown();
    //         bindParamButtons();
    //         renderCluster('All');
    //         hideLoader();
    //       });
    //   } else {
    //     buildClusterDropdown();
    //     bindParamButtons();
    //     renderCluster('All');
    //   }
    // }

    // function buildClusterDropdown() {
    //   const sel = document.getElementById('cluster-select');
    //   sel.innerHTML = `<option value="All">All clusters</option>` +
    //                   Object.keys(CLUSTERS).map(c =>
    //                     `<option value="${c}">${c}</option>`
    //                   ).join('');
    //   sel.onchange = () => renderCluster(sel.value);
    // }

    // function bindParamButtons() {
    //   document.querySelectorAll('[data-param]').forEach(btn => {
    //     btn.onclick = () => {
    //       document.querySelectorAll('[data-param]').forEach(b => b.classList.remove('active'));
    //       btn.classList.add('active');
    //       const filter = btn.dataset.param;
    //       document.querySelectorAll('#cc-stations-container .card').forEach(card => {
    //         const types = card.dataset.paramtype.split(',');
    //         card.style.display = (filter === 'all' || types.includes(filter))
    //                             ? '' : 'none';
    //       });
    //     };
    //   });
    // }

    // async function renderCluster(name) {
    //   const container = document.getElementById('cc-stations-container');
    //   container.innerHTML = '';
    //   showLoader();

    //   // 1) filter + draw mini‑map
    //   const subset = name === 'All'
    //     ? ccAllFeatures
    //     : ccAllFeatures.filter(f => CLUSTERS[name]?.includes(f.properties.station_name));
    //   ccMap.eachLayer(l => l instanceof L.CircleMarker && ccMap.removeLayer(l));
    //   const pts = subset.map(f => [f.geometry.coordinates[1], f.geometry.coordinates[0]]);
    //   pts.forEach(ll => L.circleMarker(ll,{ radius:5 }).addTo(ccMap));
    //   if (pts.length) ccMap.fitBounds(pts);

    //   // 2) no‑stations guard
    //   const ids = subset.map(f => f.properties.db_id);
    //   if (!ids.length) {
    //     container.innerHTML = `<div class="text-muted">No stations in this cluster</div>`;
    //     hideLoader();
    //     return;
    //   }

    //   // 3) fetch latest & history in parallel
    //   const qs = ids.map(id => `station_id=${id}`).join('&');
    //   let latest, history;
    //   try {
    //     [ latest, history ] = await Promise.all([
    //       fetch(`/api/cluster/latest?${qs}`).then(r => r.json()),
    //       fetch(`/api/cluster/history?${qs}`).then(r => r.json())
    //     ]);
    //   } catch (err) {
    //     container.innerHTML = `<div class="text-danger">Error loading data</div>`;
    //     hideLoader();
    //     return;
    //   }
    //   hideLoader();

    //   // 4) build a flat history lookup
    //   const byHistory = {};
    //   history.forEach(h => {
    //     const key = `${h.station}|${h.parameter}`;
    //     // map each point to its numeric value
    //     byHistory[key] = h.points.map(pt => pt.v);
    //   });

    //   // 5) group latest rows by station
    //   const byLatest = {};
    //   latest.forEach(r => {
    //     byLatest[r.station] = byLatest[r.station] || [];
    //     byLatest[r.station].push(r);
    //   });

    //   // 6) render one card per station
    //   Object.entries(byLatest).forEach(([station, readings]) => {
    //     // determine param types for filtering
    //     const types = [...new Set(readings.map(r => {
    //       if (/Air/.test(r.parameter_fullname))      return 'Air';
    //       if (/Water|Discharge/.test(r.parameter_fullname)) return 'Water';
    //       if (/Wind/.test(r.parameter_fullname))     return 'Wind';
    //       return 'Other';
    //     }))];

    //     const card = document.createElement('div');
    //     card.className = 'card mb-3';
    //     card.dataset.paramtype = types.join(',');
    //     card.innerHTML = `
    //       <div class="card-header"><h6 class="mb-0">${station}</h6></div>
    //       <div class="card-body p-2">
    //         <table class="table table-sm mb-0">
    //           <thead>
    //             <tr>
    //               <th>Parameter</th><th>Value</th><th>Trend</th>
    //               <th>Unit</th><th>Time</th><th>6‑Hour Trend</th>
    //             </tr>
    //           </thead>
    //           <tbody>
    //             ${readings.map(r => {
    //               const prev  = r.prev_value ?? r.value;
    //               const arrow = r.value > prev ? '↑' : r.value < prev ? '↓' : '→';
    //               return `
    //                 <tr>
    //                   <td>${r.parameter_fullname}</td>
    //                   <td>${r.value.toFixed(1)}</td>
    //                   <td>${arrow}</td>
    //                   <td>${r.unit}</td>
    //                   <td>${new Date(r.timestamp).toLocaleTimeString()}</td>
    //                   <td><canvas class="sparkline" width="80" height="20"></canvas></td>
    //                 </tr>`;
    //             }).join('')}
    //           </tbody>
    //         </table>
    //       </div>`;

    //     container.appendChild(card);

    //     // draw each sparkline
    //     card.querySelectorAll('.sparkline').forEach((cnv,i) => {
    //       const param = readings[i].parameter_fullname;
    //       const key   = `${station}|${param}`;
    //       const series= byHistory[key] || [];
    //       if (series.length > 1) {
    //         drawSparkline(cnv, series);
    //       } else {
    //         cnv.parentElement.textContent = '–';
    //       }
    //     });
    //   });
    // }
     
    //  // ─── Sparkline utility ────────────────────────────────────────────────────
    //  function drawSparkline(canvas, data) {
    //   const ctx = canvas.getContext('2d'),
    //         w   = canvas.width, h = canvas.height,
    //         min = Math.min(...data), max = Math.max(...data);
    //   ctx.beginPath();
    //   data.forEach((v,i) => {
    //     const x = (i/(data.length-1))*w,
    //           y = h - ((v-min)/(max-min))*h;
    //     i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
    //   });
    //   ctx.stroke();
    // }
     
     // ─── 3. Advisories stub ───────────────────────────────────────────────────
    //  function initAdvisoriesTab() {
    //    document.getElementById('tab-content')
    //      .insertAdjacentHTML('beforeend',
    //        '<div class="alert alert-info">Advisory view coming soon.</div>');
    //  }
  