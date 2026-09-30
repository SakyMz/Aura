// ============================================================================
// AURA - Home / Dashboard
// ============================================================================

async function renderHome() {
  const main = document.getElementById("app-main");
  main.classList.remove("map-full");

  const uName = appUser && appUser.name ? appUser.name.split(" ")[0] : "amiga";
  main.innerHTML = `
    <div>
      <h1 class="home-hello">Olá, ${esc(uName)}</h1>
      <p class="home-sub">Como está a região ao seu redor?</p>
      <span class="home-loc" id="home-loc">${ICONS.loc} Obtendo sua localização...</span>
    </div>
    <div class="home-grid">
      <div class="home-map-card" id="home-map"><div class="map-state"><div class="spinner"></div><p>Carregando mapa...</p></div></div>
      <div id="home-side"></div>
    </div>`;

  // Carregar relatos
  const reports = await DataAccess.listReports({ publishedOnly: true });

  // Carregar mapa com marcadores (não bloqueia em geolocalização)
  const mapEl = document.getElementById("home-map");
  const map = await AuraMap.init(mapEl, { center: { lat: -23.55, lng: -46.6333 }, zoom: 13 });
  map.mapEl = mapEl;

  reports.forEach(r => {
    map.addMarker({
      lat: r.latitude, lng: r.longitude, riskLevel: r.riskLevel,
      title: cap(r.category),
      onClick: () => openReportDetail(r)
    });
  });

  // Localização: best-effort, feita em segundo plano
  let userPos = null;
  getUserLocation().then(pos => {
    userPos = pos;
    map.addUserMarker(pos.lat, pos.lng);
    map.setCenter(pos.lat, pos.lng, 14);
    document.getElementById("home-loc").innerHTML = ICONS.loc + " Sua localização atual";
    renderHomeSide({ lat: pos.lat, lng: pos.lng, reports }, map);
  }).catch(() => {
    document.getElementById("home-loc").innerHTML = ICONS.loc + " Localização indisponível — mostrando região padrão";
    renderHomeSide({ lat: null, lng: null, reports }, map);
  });

  // Se a localização nunca chegar, garante que o sidebar apareça mesmo assim
  setTimeout(() => {
    if (!userPos) {
      renderHomeSide({ lat: null, lng: null, reports }, map);
    }
  }, 3000);
}

function renderHomeSide(ctx, map) {
  const side = document.getElementById("home-side");
  const reports = ctx.reports;
  loadRecentAround(ctx).then(near => {
    const nNear = near.length;
    const topRisk = near.length ? strongestRisk(near) : "attention";
    const riskInfo = riskDescriptor(topRisk);

    side.innerHTML = `
      <div class="safety-summary">
        <span class="risk-badge ${RISK_CLASS[topRisk]}"><span class="risk-dot"></span>${riskInfo.title}</span>
        <p class="text-sm" style="color:var(--gray-600);margin-top:12px">
          ${nNear > 0 ? nNear + " relato(s) recente(s) próximos a você." : "Nenhum relato recente próximo. Aproveite para nos ajudar relatando situações."}
        </p>
        <div class="mt-4">
          <a href="#/relatar" data-nav="report" class="btn btn-primary btn-block">${ICONS.plus} Relatar situação</a>
        </div>
      </div>

      <div class="recent-alerts">
        <h3 class="text-lg" style="color:var(--aura-900)">Alertas próximos</h3>
        <div class="alerts-list" id="recent-alerts-list">
          ${nNear ? "" : '<div class="empty-state"><span class="ico">' + ICONS.bell + '</span><p>Sem alertas no momento. Fique tranquila.</p></div>'}
        </div>
      </div>`;

    const list = document.getElementById("recent-alerts-list");
    if (nNear) {
      near.slice(0, 5).forEach(r => {
        const el = document.createElement("div");
        el.className = "report-card";
        el.innerHTML = reportCardHTML(r, true);
        el.addEventListener("click", () => openReportDetail(r));
        list.appendChild(el);
      });
    }

    side.querySelector("[data-nav='report']").addEventListener("click", e => {
      e.preventDefault(); navigateTo("report");
    });
  });
}

function strongestRisk(reports) {
  let max = null;
  reports.forEach(r => {
    const o = RISK_LEVELS[r.riskLevel] ? RISK_LEVELS[r.riskLevel].order : 1;
    const cur = max ? RISK_LEVELS[max].order : -1;
    if (o > cur) max = r.riskLevel;
  });
  return max || "attention";
}

function riskDescriptor(level) {
  const map = {
    low: { title: "Região com baixo risco" },
    attention: { title: "Região com atenção" },
    moderate: { title: "Região com atenção moderada" },
    high: { title: "Região com atenção alta" },
    critical: { title: "Região crítica" }
  };
  return map[level] || map.attention;
}

// Busca relatos próximos do ponto (raio fixo em demo; no Firebase filtraria por geo)
async function loadRecentAround(ctx) {
  const reports = ctx.reports;
  const lat = ctx.lat, lng = ctx.lng;
  if (!lat || !lng) return reports.slice(0, 5);
  return reports
    .map(r => Object.assign({ dist: haversine(lat, lng, r.latitude, r.longitude) }, r))
    .sort((a, b) => a.dist - b.dist);
}
