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

  if (name === 'map') {
    initMapTab();
  } else if (name === 'cond') {
    initConditions();
  } else if (name === 'adv') {
    initAdvisoriesTab();
  }

  hideLoader();
}


  
  /* ========================================================================
     1.  MAP TAB  
     ===================================================================== */
  // let damMap;  // hold our Leaflet instance
  let damMap = null;

function initMapTab() {
  // 1) make sure the fragment is already in the DOM
  const mapContainer = document.getElementById('main-map');
  if (!mapContainer) {
    console.error('Cannot find #main-map container');
    return;
  }

  // 2) if we already created a map on an earlier visit, destroy it
  if (damMap) {
    damMap.remove();
    damMap = null;
  }

  // 3) now create a fresh Leaflet map
  damMap = L.map('main-map').setView([43.5, -80.5], 9);

  // 4) basemap
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors',
  maxZoom: 19
}).addTo(damMap);

  // // optional: water-only overlay
  // L.tileLayer.wms('https://basemap.nationalmap.gov/arcgis/services/USGSHydroCached/MapServer/WMSServer', {
  //   layers: '0', transparent: true
  // }).addTo(damMap);

  // 5) scale bar
  L.control.scale({ imperial: false }).addTo(damMap);

  // 6) prepare your icons
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

  // 7) create layer groups
  const damLayer    = L.layerGroup().addTo(damMap);
  const accessLayer = L.layerGroup().addTo(damMap);

  // 8) static dams (window.STATIC_DAMS from your dams.js)
  window.STATIC_DAMS.forEach(d => {
    L.marker([d.lat, d.lon], { icon: damIcon })
      .addTo(damLayer)
      .bindPopup(`<strong>${d.name}</strong><br>
                  <a href="https://www.google.com/maps?q=${d.lat},${d.lon}" target="_blank">
                    Get directions
                  </a>`);
  });

  // 9) static access points
  const DAM_NAMES = new Set([ "Three Bridges Dam", "Penman’s Dam" ]);
  ACCESS_POINTS.forEach(pt => {
    const isDam = DAM_NAMES.has(pt.name);
    L.marker([pt.lat, pt.lon], { icon: isDam ? damIcon : apIcon })
      .addTo(isDam ? damLayer : accessLayer)
      .bindPopup(`<strong>${pt.name}</strong><br>
                  <a href="https://www.google.com/maps?q=${pt.lat},${pt.lon}" target="_blank">
                    Get directions
                  </a>`);
  });

  // 10) add a layers toggle control
  L.control
    .layers(null, { "Dams": damLayer, "Access Points": accessLayer }, { collapsed: false })
    .addTo(damMap);

  // 11) fit to show everything
  const fg = L.featureGroup([ ...damLayer.getLayers(), ...accessLayer.getLayers() ]);
  if (fg.getLayers().length) damMap.fitBounds(fg.getBounds().pad(0.1));
}
