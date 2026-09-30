// ============================================================================
// AURA - Atualizações da conta e dos relatos
// ============================================================================

async function openNotificationsModal() {
  openModal(`
    <div class="modal-head"><h3>Atualizações</h3><button class="x" onclick="closeModal()" aria-label="Fechar">&times;</button></div>
    <div class="modal-body"><div class="loading-state"><div class="spinner"></div><p>Carregando atualizações…</p></div></div>`);
  const body = document.querySelector(".modal-overlay.open .modal-body");
  try {
    const reports = await DataAccess.listMyReports(appUser && appUser.id);
    const items = reports.map(report => {
      const status = REPORT_STATUS[report.status] || REPORT_STATUS.pending;
      const icon = report.status === "published" ? "checkCircle" : report.status === "removed" ? "alert" : "clock";
      const title = report.status === "published" ? "Seu relato foi publicado no mapa."
        : report.status === "removed" ? "Seu relato não foi publicado. Consulte o suporte se precisar."
        : "Seu relato está aguardando análise manual.";
      return `<div class="notif-item"><span class="n-ico">${ICONS[icon]}</span>
        <div><div class="n-title">${esc(title)}</div><div class="n-time">${esc(status.label)} · ${esc(timeAgo(report.createdAt))}</div></div></div>`;
    }).join("");
    if (!body) return;
    body.innerHTML = reports.length ? items : '<div class="empty-state"><span class="ico">' + ICONS.bell + '</span><h3>Sem atualizações</h3><p>O andamento dos seus relatos aparecerá aqui.</p></div>';
  } catch (error) {
    if (body) body.innerHTML = '<div class="empty-state"><p>Não foi possível carregar suas atualizações.</p></div>';
  }
}
