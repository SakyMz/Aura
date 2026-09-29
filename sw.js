// ============================================================================
// AURA - Service Worker (PWA)
// Permite instalar o app na tela inicial do celular e funcionamento offline
// parcial. Registrado apenas quando o app é servido via HTTP/HTTPS
// (um navegador de arquivos file:// não registra service worker).
// ============================================================================
const CACHE = "aura-v2";
const CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/aura.css",
  "./css/layout.css",
  "./css/pages.css",
  "./js/config/firebase-config.js",
  "./js/constants.js",
  "./js/icons.js",
  "./js/utils.js",
  "./js/services/data.js",
  "./js/services/map.js",
  "./js/components/feedback.js",
  "./js/components/report-components.js",
  "./js/components/emergency.js",
  "./js/router.js",
  "./js/pages/landing.js",
  "./js/pages/auth.js",
  "./js/pages/verify.js",
  "./js/pages/home.js",
  "./js/pages/map-page.js",
  "./js/pages/report.js",
  "./js/pages/my-reports.js",
  "./js/pages/profile.js",
  "./js/pages/notifications.js",
  "./js/app.js"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  // não interceptorar chamadas externas (Firebase, mapas, fontes)
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetched = fetch(req).then((res) => {
        if (res && res.status === 200 && (res.type === "basic" || res.type === "default")) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(req, clone)).catch(() => {});
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
