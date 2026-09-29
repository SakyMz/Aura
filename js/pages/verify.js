// ============================================================================
// AURA - Validação manual da conta
// ============================================================================

async function renderVerificationPage() {
  const root = document.getElementById("verify-root");
  const user = await DataAccess.getCurrentUser();
  if (!user) { showAuth(); return; }
  if (user.verificationStatus === "approved") { location.hash = "/"; return; }

  const rejected = user.verificationStatus === "rejected";
  root.innerHTML = `
    <main class="verify-card">
      <a class="auth-back" href="#/" data-verify-logout>${ICONS.logout} Sair da conta</a>
      <span class="brand"><span class="brand-mark">${ICONS.logo}</span><span class="brand-name">AURA</span></span>
      <div class="verify-status-icon">${rejected ? ICONS.alert : ICONS.clock}</div>
      <h1>${rejected ? "Precisamos de uma nova foto" : "Sua conta está em análise"}</h1>
      <p>${rejected
        ? esc(user.verificationReviewNote || "A imagem enviada não permitiu concluir a validação. Envie uma nova foto legível do documento com o rosto visível.")
        : "A administradora da AURA está verificando manualmente seu documento. O acesso ao mapa e aos relatos será liberado após a aprovação."}</p>
      <div class="verify-pending-note">${ICONS.shield}<span>Seu documento fica visível apenas para a administradora e será apagado após a decisão.</span></div>
      ${!rejected ? '<button class="btn btn-secondary btn-block" id="vr-refresh">Verificar novamente</button>' : ""}
      <form id="verification-retry-form" class="mt-4">
        <div class="field"><label for="vr-document">${rejected ? "Enviar nova foto" : "Substituir foto do documento (opcional)"}</label>
          <input id="vr-document" type="file" accept="image/jpeg,image/png,image/webp" required />
        </div>
        <button class="btn ${rejected ? "btn-primary" : "btn-ghost"} btn-block" type="submit" id="vr-submit">${rejected ? "Enviar para nova análise" : "Atualizar documento"}</button>
      </form>
    </main>`;

  root.querySelector("[data-verify-logout]").addEventListener("click", async e => {
    e.preventDefault();
    await DataAccess.signOut();
    appUser = null;
    location.hash = "/";
    showLanding();
  });
  const refresh = root.querySelector("#vr-refresh");
  if (refresh) refresh.addEventListener("click", async () => {
    const latest = await DataAccess.getCurrentUser();
    if (latest && latest.verificationStatus === "approved") { location.hash = "/"; return; }
    toast("Sua análise ainda está pendente.", "info");
  });
  const form = root.querySelector("#verification-retry-form");
  if (form) form.addEventListener("submit", async e => {
    e.preventDefault();
    const file = root.querySelector("#vr-document").files[0];
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
      toast("Selecione uma imagem JPG, PNG ou WebP de até 5 MB.", "warning"); return;
    }
    const button = root.querySelector("#vr-submit");
    button.disabled = true; button.textContent = "Enviando…";
    try {
      await DataAccess.uploadVerificationDocument(file);
      appUser = await DataAccess.getCurrentUser();
      toast("Documento enviado para análise.", "success");
      renderVerificationPage();
    } catch (error) {
      button.disabled = false; button.textContent = rejected ? "Enviar para nova análise" : "Atualizar documento";
      toast(error.message || "Não foi possível enviar a imagem.", "error");
    }
  });
}
