// ============================================================================
// AURA - Módulo de mapa
// ----------------------------------------------------------------------------
// Se a chave do Google Maps estiver configurada (AURA_GOOGLE_MAPS_KEY),
// usa Google Maps JavaScript API. Caso contrário, usa Leaflet (OpenStreetMap)
// como mapa de demonstração — a arquitetura é a mesma e trocar é transparente.
// ============================================================================

const AuraMap = {
  currentMap: null,
  mapContainer: null,
  markers: [],
  userMarker: null,
  engine: null, // "google" | "leaflet"

  async init(containerEl, opts) {
    opts = opts || {};
    this.mapContainer = containerEl;
    const hasKey = !!(window.AURA_GOOGLE_MAPS_KEY || "");
    if (hasKey) {
      await loadGoogleMaps();
      this.engine = "google";
      this.currentMap = new google.maps.Map(containerEl, buildGoogleOpts(opts));
      if (opts.center) this.currentMap.setCenter(opts.center);
      return this;
    }
    // Fallback: Leaflet (demo)
    await loadLeaflet();
    this.engine = "leaflet";
    containerEl.style.background = "#e6e8eb";
    this.currentMap = L.map(containerEl);
    this.tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: "&copy; OpenStreetMap"
    }).addTo(this.currentMap);
    if (opts.center) {
      this.currentMap.setView([opts.center.lat, opts.center.lng], opts.zoom || 14);
    } else {
      this.currentMap.setView([-23.55, -46.6333], 12);
    }
    return this;
  },

  setCenter(lat, lng, zoom) {
    if (this.engine === "google") {
      this.currentMap.setCenter({ lat, lng });
      if (zoom) this.currentMap.setZoom(zoom);
    } else {
      this.currentMap.setView([lat, lng], zoom || 14);
    }
  },

  // Adiciona marcador colorido por nível de risco
  addMarker({ lat, lng, riskLevel, title, onClick }) {
    const color = riskColor(riskLevel);
    let m;
    if (this.engine === "google") {
      m = new google.maps.Marker({
        position: { lat, lng }, map: this.currentMap, title: title || "",
        icon: googleMarker(color)
      });
      if (onClick) m.addListener("click", onClick);
    } else {
      const icon = L.divIcon({
        className: "",
        html: '<div class="aura-marker" style="--mc:' + color + '">' + ICONS.pinSolid + '</div>',
        iconSize: [30, 30], iconAnchor: [15, 30]
      });
      m = L.marker([lat, lng], { icon }).addTo(this.currentMap);
      if (onClick) m.on("click", onClick);
    }
    this.markers.push(m);
    return m;
  },

  addUserMarker(lat, lng) {
    if (this.userMarker) this.removeUserMarker();
    let m;
    if (this.engine === "google") {
      m = new google.maps.Marker({
        position: { lat, lng }, map: this.currentMap, title: "Você",
        icon: googleUserMarker()
      });
    } else {
      const icon = L.divIcon({
        className: "",
        html: '<div class="aura-marker user">' + ICONS.pinSolid + '</div>',
        iconSize: [34, 34], iconAnchor: [17, 34]
      });
      m = L.marker([lat, lng], { icon }).addTo(this.currentMap);
    }
    this.userMarker = m;
    return m;
  },

  removeUserMarker() {
    if (!this.userMarker) return;
    if (this.engine === "google") this.userMarker.setMap(null);
    else this.currentMap.removeLayer(this.userMarker);
    this.userMarker = null;
  },

  clearMarkers() {
    this.removeUserMarker();
    this.markers.forEach(m => {
      if (this.engine === "google") m.setMap(null);
      else this.currentMap.removeLayer(m);
    });
    this.markers = [];
  },

  fitTo(lats, lngs) {
    if (!lats.length) return;
    if (this.engine === "google") {
      const b = new google.maps.LatLngBounds();
      lats.forEach((lt, i) => b.extend({ lat: lt, lng: lngs[i] }));
      this.currentMap.fitBounds(b);
    } else {
      const b = L.latLngBounds(lats.map((lt, i) => [lt, lngs[i]]));
      this.currentMap.fitBounds(b.pad(0.2));
    }
  }
};

function riskColor(level) {
  switch ((level || "attention")) {
    case "low": return "#16a34a";
    case "attention": return "#eab308";
    case "moderate": return "#f97316";
    case "high": return "#dc2626";
    case "critical": return "#991b1b";
    default: return "#8b5cf6";
  }
}

function riskWeight(level) {
  switch ((level || "attention")) {
    case "low": return 0.6;
    case "attention": return 0.7;
    case "moderate": return 0.8;
    case "high": return 0.9;
    case "critical": return 1;
    default: return 0.75;
  }
}

function googleMarker(color) {
  const size = 30;
  return {
    path: "M12 0C7.6 0 4 3.6 4 8c0 6 8 13 8 13s8-7 8-13c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
    fillColor: color, fillOpacity: 1,
    strokeColor: "#fff", strokeWeight: 2,
    anchor: new google.maps.Point(12, 21),
    scaledSize: new google.maps.Size(size, size)
  };
}
function googleUserMarker() {
  return {
    path: "M12 0C7.6 0 4 3.6 4 8c0 6 8 13 8 13s8-7 8-13c0-4.4-3.6-8-8-8zm0 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6z",
    fillColor: "#8b5cf6", fillOpacity: 1,
    strokeColor: "#fff", strokeWeight: 3,
    anchor: new google.maps.Point(12, 21),
    scaledSize: new google.maps.Size(34, 34)
  };
}

let _googleLoading = null;
function loadGoogleMaps() {
  if (window.google && window.google.maps) return Promise.resolve();
  if (_googleLoading) return _googleLoading;
  _googleLoading = new Promise((resolve, reject) => {
    const key = window.AURA_GOOGLE_MAPS_KEY;
    const cb = "auraGoogleReady";
    window[cb] = () => resolve();
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + key + "&callback=" + cb;
    s.async = true; s.onerror = () => reject(new Error("Falha ao carregar Google Maps"));
    document.head.appendChild(s);
  });
  return _googleLoading;
}

let _leafletLoading = null;
function loadLeaflet() {
  if (window.L) return Promise.resolve();
  if (_leafletLoading) return _leafletLoading;
  _leafletLoading = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    const s = document.createElement("script");
    s.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.head.appendChild(s);
    setTimeout(resolve, 8000);
  });
  return _leafletLoading;
}

// Localização do navegador
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error("Geolocalização indisponível")); return; }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(err), { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}
