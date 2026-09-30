// ============================================================================
// AURA - Componentes de relato (cards + modal de detalhe)
// ============================================================================

function categoryLabel(key) {
  const c = CATEGORIES.find(x => x.key === key);
  return c ? c.label : cap(key);
}

function reportCardHTML(r, compact) {
  const risk = r.riskLevel || "attention";
  const statusBadge = r.status && r.status !== "published"
    ? '<span class="status-badge st-' + r.status + '">' + (REPORT_STATUS[r.status] ? REPORT_STATUS[r.status].label : cap(r.status)) + '</span>'
    : "";
  return `
    <div class="rc-top">
      <span class="cat-chip">${ICONS[CATEGORY_ICON[r.category] || "flag"] || ICONS.flag}${esc(categoryLabel(r.category))}</span>
      <span class="risk-badge ${RISK_CLASS[risk]}"><span class="risk-dot"></span>${RISK_LEVELS[risk].label}</span>
    </div>
    ${r.description ? '<p class="rc-desc">' + esc(truncate(r.description, 90)) + '</p>' : ""}
    <div class="rc-meta">
      <span>${ICONS.pin}${r.dist != null ? fmtKm(r.dist) : "Área próxima"}</span>
      <span>${ICONS.clock}${timeAgo(r.date || r.createdAt)}</span>
      ${r.relatedCount ? "<span>" + ICONS.users + " " + r.relatedCount + " relatos</span>" : ""}
      ${statusBadge}
    </div>
    ${compact ? '<div class="rc-foot"><span class="btn btn-secondary btn-sm">Ver detalhes</span></div>' : ""}
  `;
}

function truncate(s, n) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

// Modal de detalhe de relato
function openReportDetail(r) {
  const risk = r.riskLevel || "attention";
  const riskInfo = {
    low: { title: "Baixo", desc: "Sem risco significativo relatado." },
    attention: { title: "Atenção", desc: "Observe o ambiente ao redor." },
    moderate: { title: "Moderado", desc: "Redobre o cuidado nesta região." },
    high: { title: "Alto", desc: "Circule com atenção redobrada." },
    critical: { title: "Crítico", desc: "Evite a região se possível." }
  }[risk] || { title: "Atenção", desc: "Observe o ambiente." };

  const html = `
    <div class="modal-head"><h3>Detalhes do relato</h3><button class="x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="detail-hero" style="background:${riskBg(risk)}">
        <div>
          <div class="cat-chip" style="background:#fff;border:none">${ICONS[CATEGORY_ICON[r.category] || "flag"]}${esc(categoryLabel(r.category))}</div>
          <div style="margin-top:12px">
            <span class="risk-badge ${RISK_CLASS[risk]}"><span class="risk-dot"></span>${riskInfo.title}</span>
            <p style="font-size:13px;color:#6b7280;margin-top:6px">${riskInfo.desc}</p>
          </div>
        </div>
      </div>
      ${r.description ? '<p class="detail-desc">' + esc(r.description) + '</p>' : ""}
      <div class="detail-grid">
        <div class="detail-item"><div class="d-lbl">Categoria</div><div class="d-val">${esc(categoryLabel(r.category))}</div></div>
        <div class="detail-item"><div class="d-lbl">Data aprox.</div><div class="d-val">${fmtDate(r.date || r.createdAt)}</div></div>
        <div class="detail-item"><div class="d-lbl">Nível</div><div class="d-val">${riskInfo.title}</div></div>
        <div class="detail-item"><div class="d-lbl">Relatos relacionados</div><div class="d-val">${r.relatedCount || 1}</div></div>
      </div>
      <div class="anon-note">${ICONS.shield} Relato compartilhado de forma anônima com a comunidade.</div>
      <div class="mt-4 flex" style="gap:10px">
        <a class="btn btn-primary" target="_blank"
           href="${mapUrl(r.latitude, r.longitude)}">Ver no mapa ${ICONS.arrowRight}</a>
        <button class="btn btn-ghost" onclick="closeModal()">Fechar</button>
      </div>
    </div>`;
  openModal(html);
}

function riskBg(level) {
  return {
    low: "var(--risk-low-bg)", attention: "var(--risk-attn-bg)",
    moderate: "var(--risk-mod-bg)", high: "var(--risk-high-bg)", critical: "var(--risk-crit-bg)"
  }[level] || "var(--aura-50)";
}

function mapUrl(lat, lng) {
  if (isFirebaseLive() && window.AURA_GOOGLE_MAPS_KEY) {
    return "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lng;
  }
  return "https://www.openstreetmap.org/?mlat=" + lat + "&mlon=" + lng + "#map=16/" + lat + "/" + lng;
}
