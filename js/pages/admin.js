// ============================================================================
// AURA - Painel Administrativo (somente usuários autorizados)
// ============================================================================

async function renderAdmin() {
  const main = document.getElementById("app-main");
  main.classList.remove("map-full");

  const stats = await DataAccess.adminStats();

  const topCats = Object.entries(stats.categories || {})
    .sort((a, b) => b[1] - a[1]).slice(0, 5);

  main.innerHTML = `
    <div class="page-head">
      <div><h1>Painel administrativo</h1><p>Visão geral e moderação de relatos.</p></div>
    </div>

    <div class="admin-stats">
      ${statCard("users", ICONS.users, stats.totalUsers, "Usuários", "background:var(--aura-100);color:var(--aura-600)")}
      ${statCard("reports", ICONS.flag, stats.totalReports, "Relatos", "background:#e0f2fe;color:#0369a1")}
      ${statCard("pending", ICONS.clock, stats.pending, "Pendentes", "background:var(--warning-bg);color:var(--warning)")}
      ${statCard("published", ICONS.checkCircle, stats.published, "Publicados", "background:var(--success-bg);color:var(--success)")}
    </div>

    <div class="admin-cols">
      <div>
        <div class="card">
          <h3 class="mb-2">Moderação de relatos</h3>
          <p class="text-sm text-muted mb-4" style="margin-bottom:16px">Relatos aguardando análise. Aprove ou recuse para publicar.</p>
          <div id="admin-mod-list">
            <div class="loading-state"><div class="spinner"></div></div>
          </div>
        </div>
      </div>
      <div>
        <div class="card">
          <h3 class="mb-2">Categorias mais frequentes</h3>
          <div style="margin-top:12px" id="admin-cats"></div>
        </div>
        <div class="card mt-6">
          <h3 class="mb-2">Regiões com maior concentração</h3>
          <p class="text-sm text-muted" style="margin-top:12px">Baseado nos relatos publicados próximos entre si. O cálculo completo chega com o índice de atenção da região.</p>
        </div>
      </div>
    </div>`;

  // categorias
  const catsEl = document.getElementById("admin-cats");
  if (topCats.length) {
    topCats.forEach(([k, v]) => {
      const max = topCats[0][1] || 1;
      const pct = Math.round((v / max) * 100);
      const div = document.createElement("div");
      div.className = "mini-cat";
      div.innerHTML = '<span class="ct-name">' + esc(categoryLabel(k)) + '</span><span class="ct-count">' + v + '</span>' +
        '<div style="grid-column:1/-1;height:6px;background:var(--gray-100);border-radius:99px;margin-top:6px"><div style="height:100%;width:' + pct + '%;background:linear-gradient(90deg,var(--aura-500),var(--aura-pink));border-radius:99px"></div></div>';
      div.style.flexDirection = "column";
      catsEl.appendChild(div);
    });
  } else {
    catsEl.innerHTML = emptyStateHTML("chart", "Sem dados", "Publique relatos para ver as categorias.");
  }

  await renderModerationList();
}

function statCard(id, ico, num, lbl, icoStyle) {
  return '<div class="stat-card"><div class="st-ico" style="' + icoStyle + '">' + ico + '</div>' +
    '<div class="st-num">' + num + '</div><div class="st-lbl">' + lbl + '</div></div>';
}

async function renderModerationList() {
  const list = document.getElementById("admin-mod-list");
  const pending = await DataAccess.adminListPending();

  if (!pending.length) {
    list.innerHTML = emptyStateHTML("checkCircle", "Tudo em dia", "Não há relatos aguardando moderação.");
    return;
  }

  list.innerHTML = "";
  pending.forEach(r => {
    const risk = r.riskLevel || "attention";
    const mod = document.createElement("div");
    mod.className = "mod-card";
    mod.innerHTML = `
      <div class="rc-top">
        <span class="cat-chip">${ICONS[CATEGORY_ICON[r.category] || "flag"]}${esc(categoryLabel(r.category))}</span>
        <span class="risk-badge ${RISK_CLASS[risk]}"><span class="risk-dot"></span>${RISK_LEVELS[risk].label}</span>
      </div>
      <p class="text-sm mt-2" style="color:var(--gray-600)">${esc(r.description || "(sem descrição)")}</p>
      <div class="rc-meta">
        <span>${ICONS.pin}${r.latitude ? r.latitude.toFixed(4) + ", " + r.longitude.toFixed(4) : "Sem local"}</span>
        <span>${ICONS.clock}${timeAgo(r.createdAt)}</span>
      </div>
      <div class="mc-actions">
        <button class="btn btn-sm btn-primary" data-approve>${ICONS.check} Aprovar</button>
        <button class="btn btn-sm btn-secondary" data-reject>${ICONS.close} Recusar</button>
        <button class="btn btn-sm btn-danger" data-remove>${ICONS.trash} Remover</button>
      </div>`;
    mod.querySelector("[data-approve]").addEventListener("click", async () => {
      await DataAccess.adminSetStatus(r.id, "published");
      toast("Relato aprovado e publicado.", "success");
      renderModerationList();
    });
    mod.querySelector("[data-reject]").addEventListener("click", async () => {
      await DataAccess.adminSetStatus(r.id, "removed");
      toast("Relato recusado.", "warning");
      renderModerationList();
    });
    mod.querySelector("[data-remove]").addEventListener("click", async () => {
      await DataAccess.adminSetStatus(r.id, "removed");
      toast("Relato removido.", "info");
      renderModerationList();
    });
    list.appendChild(mod);
  });
}
