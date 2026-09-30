// ============================================================================
// AURA - Utilitários compartilhados (formatação, datas, DOM helpers)
// ============================================================================

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) +
    " às " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

// "Há 2 horas", "Há 3 dias", etc.
function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return "agora";
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "há " + sec + "s";
  const min = Math.floor(sec / 60);
  if (min < 60) return "há " + min + "min";
  const hr = Math.floor(min / 60);
  if (hr < 24) return "há " + hr + "h";
  const day = Math.floor(hr / 24);
  if (day < 30) return "há " + day + "d";
  const mo = Math.floor(day / 30);
  return "há " + mo + " mes" + (mo > 1 ? "es" : "");
}

// Distância entre dois pontos (Haversine) em km
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function fmtKm(km) {
  if (km < 1) return Math.round(km * 1000) + "m";
  return km.toFixed(1) + "km";
}

function esc(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function debounce(fn, ms) {
  let t;
  return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); };
}

function cap(s) {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
