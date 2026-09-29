// ============================================================================
// AURA - Página Mapa (principal funcionalidade)
// ============================================================================

async function renderMapPage() {
  const main = document.getElementById("app-main");
  main.classList.add("map-full");

  let lat = null, lng = null;
  try {
    const pos = await getUserLocation();
    lat = pos.lat; lng = pos.lng;
  } catch (e) { /* sem localização */ }

  main.innerHTML = `
    <div class="map-page-wrap">
      <div class="map-canvas" id="map-canvas"></div>
      <div class="map-toolbar">
        <button class="icon-btn" id="map-locate" title="Minha localização">${ICONS.loc}</button>
        <button class="icon-btn" id="map-refresh" title="Atualizar">${ICONS.refresh}</button>
      </div>
      <div class="map-fab-report">
        <a href="#/relatar" data-nav="report" class="btn btn-primary">${ICONS.plus} Relatar situação</a>
      </div>
      <div class="risk-legend-panel" id="map-legend">
        ${legendItem("#16a34a", "Baixo")}
        ${legendItem("#eab308", "Atenção")}
        ${legendItem("#f97316", "Moderado")}
        ${legendItem("#dc2626", "Alto")}
      </div>
      <div class="map-side" id="map-side"></div>
    </div>`;

  main.querySelector("[data-nav='report']").addEventListener("click", e => {
    e.preventDefault(); navigateTo("report");
  });
  document.getElementById("map-locate").addEventListener("click", () => locateOnMap());
  document.getElementById("map-refresh").addEventListener("click", () => loadMapData());

  activeMap = document.getElementById("map-canvas");
  await loadMapData();
}

let activeMap = null;
let currentReports = [];

async function loadMapData() {
  // mostra loading leve
  const reports = await DataAccess.listReports({ publishedOnly: true });
  currentReports = reports;

  // Inicializa/carrega o mapa no container atual
  let map = AuraMap.currentMap && AuraMap.mapContainer === activeMap ? AuraMap.currentMap : null;
  if (!map) {
    await AuraMap.init(activeMap, { center: { lat: -23.55, lng: -46.6333 }, zoom: 13 });
    AuraMap.mapContainer = activeMap;
  }
  AuraMap.clearMarkers();

  // Adiciona os marcadores de relato imediatamente (não dependem de localização)
  reports.forEach(r => {
    AuraMap.addMarker({
      lat: r.latitude, lng: r.longitude, riskLevel: r.riskLevel,
      title: cap(r.category),
      onClick: () => openReportDetail(r)
    });
  });
  renderMapSide({ lat: null, lng: null, reports });

  // Localização é opcional/best-effort e não bloqueia a renderização
  getUserLocation().then(pos => {
    AuraMap.addUserMarker(pos.lat, pos.lng);
    AuraMap.setCenter(pos.lat, pos.lng, 14);
    renderMapSide({ lat: pos.lat, lng: pos.lng, reports });
  }).catch(() => {});
}

function renderMapSide(ctx) {
  const side = document.getElementById("map-side");
  if (!side) return;
  const reports = ctx.reports;
  let near = reports;
  if (ctx.lat && ctx.lng) {
    near = reports.map(r => Object.assign({ dist: haversine(ctx.lat, ctx.lng, r.latitude, r.longitude) }, r))
      .sort((a, b) => a.dist - b.dist);
  }
  const top = near.slice(0, 4);
  side.innerHTML = `<h3 class="text-sm" style="color:var(--gray-500);margin-bottom:10px;font-weight:600">Próximos a você</h3>
    <div style="display:flex;flex-direction:column;gap:10px">${top.length ? "" : '<div class="empty-state"><span class="ico">' + ICONS.pin + '</span><p>Sem relatos na região ainda.</p></div>'}</div>`;
  const box = side.querySelector("div[style]") || side.firstElementChild.nextElementSibling;
  top.forEach(r => {
    const el = document.createElement("div");
    el.className = "report-card";
    el.innerHTML = reportCardHTML(r, true);
    el.addEventListener("click", () => openReportDetail(r));
    box.appendChild(el);
  });
}

async function locateOnMap() {
  try {
    const p = await getUserLocation();
    AuraMap.setCenter(p.lat, p.lng, 15);
    toast("Centralizando na sua localização.", "success");
  } catch (e) {
    toast("Não foi possível obter sua localização. Verifique as permissões.", "error");
  }
}

function legendItem(color, label) {
  return '<span class="rl"><span class="dot" style="background:' + color + '"></span>' + label + '</span>';
}
