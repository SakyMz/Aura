// ============================================================================
// AURA - Meus relatos
// ============================================================================

async function renderMyReports() {
  const main = document.getElementById("app-main");
  main.classList.remove("map-full");

  const uid = appUser && appUser.id ? appUser.id : getCurrentUid();
  const reports = await DataAccess.listMyReports(uid);

  main.innerHTML = `
    <div class="page-head">
      <div>
        <h1>Meus relatos</h1>
        <p>Histórico e andamento das situações que você relatou.</p>
      </div>
      <a href="#/relatar" data-nav="report" class="btn btn-primary">${ICONS.plus} Novo relato</a>
    </div>
    <div class="grid-2" id="myreports-grid">
      ${reports.length ? "" : emptyStateHTML("list", "Você ainda não fez relatos", "Quando você relatar uma situação, ela aparecerá aqui. Clique acima para criar um relato.")}
    </div>`;

  main.querySelector("[data-nav='report']").addEventListener("click", e => {
    e.preventDefault(); navigateTo("report");
  });

  if (reports.length) {
    const grid = document.getElementById("myreports-grid");
    reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    reports.forEach(r => {
      const el = document.createElement("div");
      el.className = "report-card";
      el.innerHTML = reportCardHTMLWithStatus(r);
      el.addEventListener("click", () => openReportDetail(r));
      grid.appendChild(el);
    });
  }
}

function reportCardHTMLWithStatus(r) {
  const risk = r.riskLevel || "attention";
  const st = r.status || "pending";
  return `
    <div class="rc-top">
      <span class="cat-chip">${ICONS[CATEGORY_ICON[r.category] || "flag"]}${esc(categoryLabel(r.category))}</span>
      <span class="status-badge st-${st}">${REPORT_STATUS[st] ? REPORT_STATUS[st].label : cap(st)}</span>
    </div>
    ${r.description ? '<p class="rc-desc">' + esc(truncate(r.description, 90)) + '</p>' : ""}
    <div class="rc-meta">
      <span>${ICONS.pin}Área próxima</span>
      <span>${ICONS.clock}${fmtDate(r.date || r.createdAt)}</span>
      <span class="risk-badge ${RISK_CLASS[risk]}"><span class="risk-dot"></span>${RISK_LEVELS[risk].label}</span>
    </div>`;
}
