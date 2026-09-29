// ============================================================================
// AURA - Relatar uma situação
// ============================================================================

let reportState = {
  category: null,
  risk: "attention",
  lat: null,
  lng: null,
  date: null,
  image: null,
  imageDataUrl: null
};

async function renderReportPage() {
  reportState = { category: null, risk: "attention", lat: null, lng: null, date: null, image: null, imageDataUrl: null };
  const main = document.getElementById("app-main");
  main.classList.remove("map-full");

  main.innerHTML = `
  <div class="report-form-wrap">
    <div class="page-head">
      <div>
        <h1>Relatar uma situação</h1>
        <p>Compartilhe o que você vivenciou para ajudar outras mulheres.</p>
      </div>
    </div>

    <form id="report-form" novalidate>
      <div class="field">
        <label>Categoria</label>
        <div class="cat-grid" id="cat-grid">
          ${CATEGORIES.map(c =>
            '<button type="button" class="cat-btn" data-cat="' + c.key + '">' +
            (ICONS[CATEGORY_ICON[c.key] || "flag"] || ICONS.flag) + esc(c.label) + '</button>'
          ).join("")}
        </div>
      </div>

      <div class="field">
        <label>Localização</label>
        <div class="loc-picker" id="loc-picker">
          <button type="button" class="btn btn-secondary" id="use-my-loc">${ICONS.loc} Usar minha localização atual</button>
          <div class="loc-info mt-2" id="loc-info">
            ${ICONS.pin} <span>Nenhuma localização selecionada</span>
          </div>
        </div>
      </div>

      <div class="field">
        <label>Nível de atenção</label>
        <div class="seg-control" id="risk-seg">
          ${riskSegment("baixo", "Baixo", "#16a34a", "low")}
          ${riskSegment("medio", "Médio", "#eab308", "moderate")}
          ${riskSegment("alto", "Alto", "#f97316", "high")}
          ${riskSegment("critico", "Crítico", "#dc2626", "critical")}
        </div>
      </div>

      <div class="field">
        <label>Descrição do ocorrido</label>
        <textarea id="r-desc" rows="4" maxlength="600"
          placeholder="Descreva o que aconteceu, sem se identificar. Ex.: abordagem de uma pessoa em uma moto próximo à saída da estação."></textarea>
        <span class="text-sm" style="color:var(--gray-400);text-align:right" id="desc-count">0/600</span>
      </div>

      <div class="field">
        <label>Data e horário</label>
        <input type="datetime-local" id="r-date" />
      </div>

      <div class="field">
        <label>Foto (opcional)</label>
        <input type="file" id="r-photo" accept="image/*" style="display:none" />
        <button type="button" class="btn btn-secondary" id="r-upload">${ICONS.camera} Anexar imagem</button>
        <img id="r-photo-preview" class="photo-preview hidden" alt="Prévia da foto" />
        <button type="button" class="btn btn-ghost btn-sm hidden" id="r-remove-photo" style="margin-top:8px">Remover foto</button>
      </div>

      <div class="anon-callout">${ICONS.shield}
        <div><strong>Seu relato será compartilhado de forma anônima com a comunidade.</strong><br>
        <span style="color:var(--aura-600)">Não exibiremos sua identidade nem sua localização pessoal para outras usuárias.</span></div>
      </div>

      <button type="submit" class="btn btn-primary btn-block btn-lg" id="r-submit">${ICONS.flag} Enviar relato</button>
    </form>
  </div>`;

  // evento de data default = agora
  document.getElementById("r-date").value = toLocalInput(new Date());

  // categoria
  document.querySelectorAll("[data-cat]").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll("[data-cat]").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      reportState.category = b.getAttribute("data-cat");
    });
  });

  // risco
  document.querySelectorAll("#risk-seg .seg-btn").forEach(b => {
    b.addEventListener("click", () => {
      document.querySelectorAll("#risk-seg .seg-btn").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      reportState.risk = riskOfForm(b.getAttribute("data-risk"));
    });
  });
  document.querySelector('#risk-seg .seg-btn[data-risk="medio"]').classList.add("selected");

  // localização
  document.getElementById("use-my-loc").addEventListener("click", async () => {
    try {
      const p = await getUserLocation();
      reportState.lat = p.lat; reportState.lng = p.lng;
      const info = document.querySelector("#loc-info span");
      info.textContent = "Localização selecionada automaticamente";
      document.getElementById("loc-picker").classList.add("has-loc");
      toast("Localização atual usada.", "success");
    } catch (e) {
      toast("Não foi possível obter sua localização.", "error");
    }
  });

  // descrição contador
  document.getElementById("r-desc").addEventListener("input", e => {
    document.getElementById("desc-count").textContent = e.target.value.length + "/600";
  });

  // foto
  document.getElementById("r-upload").addEventListener("click", () => document.getElementById("r-photo").click());
  document.getElementById("r-photo").addEventListener("change", e => {
    const f = e.target.files[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast("Selecione uma imagem válida.", "warning"); return; }
    if (f.size > 4 * 1024 * 1024) { toast("Imagem muito grande (máx. 4MB).", "warning"); return; }
    reportState.image = f;
    const reader = new FileReader();
    reader.onload = ev => {
      const img = document.getElementById("r-photo-preview");
      img.src = ev.target.result; img.classList.remove("hidden");
      document.getElementById("r-remove-photo").classList.remove("hidden");
      document.getElementById("r-upload").textContent = "Trocar imagem";
    };
    reader.readAsDataURL(f);
  });
  document.getElementById("r-remove-photo").addEventListener("click", () => {
    reportState.image = null;
    document.getElementById("r-photo").value = "";
    document.getElementById("r-photo-preview").classList.add("hidden");
    document.getElementById("r-remove-photo").classList.add("hidden");
    document.getElementById("r-upload").textContent = "Anexar imagem";
  });

  // submit
  document.getElementById("r-desc").value = "";
  document.getElementById("report-form").addEventListener("submit", submitReport);
}

function riskSegment(id, label, color, sysKey) {
  return '<button type="button" class="seg-btn" data-risk="' + id + '">' +
    '<span class="dot" style="background:' + color + '"></span>' + label + '</button>';
}

function toLocalInput(d) {
  const pad = n => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) +
    "T" + pad(d.getHours()) + ":" + pad(d.getMinutes());
}

async function submitReport(e) {
  e.preventDefault();
  const desc = document.getElementById("r-desc").value.trim();
  const btn = document.getElementById("r-submit");

  if (!reportState.category) { toast("Selecione uma categoria.", "warning"); return; }
  if (!reportState.lat || !reportState.lng) { toast("Selecione a localização (use sua localização atual).", "warning"); return; }
  if (desc.length < 10) { toast("Descreva o ocorrido com pelo menos 10 caracteres.", "warning"); return; }

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Enviando...';
  try {
    let imageUrl = "";
    if (reportState.image) {
      toast("Enviando imagem...", "info", 2000);
      imageUrl = await DataAccess.uploadImage(reportState.image);
      if (!imageUrl && isFirebaseLive()) {
        toast("Não foi possível enviar a imagem. Enviando relato sem foto.", "warning");
      }
    }
    const date = document.getElementById("r-date").value
      ? new Date(document.getElementById("r-date").value).toISOString()
      : new Date().toISOString();

    await DataAccess.createReport({
      category: reportState.category,
      description: desc,
      latitude: reportState.lat,
      longitude: reportState.lng,
      riskLevel: reportState.risk,
      date,
      imageUrl
    });
    showReportSuccess();
  } catch (err) {
    console.error(err);
    btn.disabled = false;
    btn.innerHTML = ICONS.flag + " Enviar relato";
    toast("Não foi possível enviar o relato. Tente novamente.", "error");
  }
}

function showReportSuccess() {
  openModal(`
    <div class="modal-body center" style="padding:34px 30px">
      <div class="success-check">${ICONS.check}</div>
      <div class="success-title">Relato enviado</div>
      <p class="success-msg">Obrigada por contribuir para uma cidade mais segura. Seu relato será analisado e, se aprovado, compartilhado anonimamente com a comunidade.</p>
      <div class="flex mt-6" style="gap:10px;justify-content:center;flex-wrap:wrap">
        <a class="btn btn-primary" href="#/meus-relatos" onclick="closeModal()">Ver meus relatos</a>
        <button class="btn btn-ghost" onclick="closeModal();navigateTo('report')">Novo relato</button>
      </div>
    </div>`);
}
