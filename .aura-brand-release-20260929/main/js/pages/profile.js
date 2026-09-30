// ============================================================================
// AURA - Perfil
// ============================================================================

async function renderProfile() {
  const main = document.getElementById("app-main");
  main.classList.remove("map-full");

  const u = appUser;
  const myCount = (await DataAccess.listMyReports(u.id)).length;
  const initials = nameInitials(u.name || u.email);

  main.innerHTML = `
    <div class="page-head"><h1>Meu perfil</h1></div>
    <div class="card profile-card" style="max-width:420px;margin:0 auto 20px">
      <div class="avatar lg" id="pf-avatar">
        ${u.profileImage ? '<img src="' + esc(u.profileImage) + '" alt="foto"/>' : '<span>' + esc(initials) + '</span>'}
      </div>
      <h2>${esc(u.name || "Usuária")}</h2>
      <div class="email">${esc(u.email || "")}</div>
      <div class="profile-stats">
        <div class="profile-stat"><div class="num">${myCount}</div><div class="lbl">Relatos</div></div>
        <div class="profile-stat"><div class="num" id="pf-verification">—</div><div class="lbl">Validação</div></div>
      </div>
    </div>

    <div class="card" style="max-width:420px;margin:0 auto">
      <div class="settings-list">
        <a class="settings-item" data-action="edit">${ICONS.edit}<span>Editar perfil</span><span class="chev">${ICONS.chevronDown}</span></a>
        <a class="settings-item" data-action="pass">${ICONS.lock}<span>Alterar senha</span><span class="chev">${ICONS.chevronDown}</span></a>
        <a class="settings-item" data-action="notif">${ICONS.bell}<span>Notificações</span><span class="chev">${ICONS.chevronDown}</span></a>
        <a class="settings-item" data-action="emergency">${ICONS.alert}<span>Ajuda e emergência</span><span class="chev">${ICONS.chevronDown}</span></a>
        <span class="settings-item" data-action="privacy">${ICONS.shield}<span>Privacidade</span><span class="chev">${ICONS.chevronDown}</span></span>
        <span class="settings-item" data-action="terms">${ICONS.info}<span>Termos de uso</span><span class="chev">${ICONS.chevronDown}</span></span>
        <span class="settings-item" data-action="policy">${ICONS.mail}<span>Política de privacidade</span><span class="chev">${ICONS.chevronDown}</span></span>
        <a class="settings-item danger" data-action="logout">${ICONS.logout}<span>Sair</span></a>
      </div>
    </div>`;

  document.getElementById("pf-verification").textContent = u.verificationStatus === "approved" ? "Aprovada" : "Pendente";

  main.querySelectorAll(".settings-item").forEach(el => {
    el.addEventListener("click", () => {
      const act = el.getAttribute("data-action");
      handleSetting(act);
    });
  });
}

function nameInitials(nameStr) {
  const parts = String(nameStr || "").split(" ").filter(Boolean);
  if (!parts.length) return "A";
  return ((parts[0][0] || "") + (parts[1] && parts[1][0] ? parts[1][0] : "")).toUpperCase();
}

function handleSetting(action) {
  switch (action) {
    case "edit": openEditProfile(); break;
    case "pass": openChangePassword(); break;
    case "notif": openNotificationsModal(); break;
    case "emergency": openEmergencyModal(); break;
    case "privacy": openLegalModal("privacy"); break;
    case "terms": openLegalModal("terms"); break;
    case "policy": openLegalModal("privacy"); break;
    case "logout": doLogout(); break;
  }
}

function openEditProfile() {
  const u = appUser;
  openModal(`
    <div class="modal-head"><h3>Editar perfil</h3><button class="x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="field"><label>Nome</label><input id="ep-name" value="${esc(u.name || "")}" /></div>
      <div class="field"><label>Foto de perfil</label>
        <input type="file" id="ep-photo" accept="image/jpeg,image/png,image/webp" style="display:none"/>
        <button type="button" class="btn btn-secondary" data-open-photo>${ICONS.camera} Escolher foto</button>
        <span class="text-sm text-muted" id="ep-photo-name"></span>
      </div>
      <button class="btn btn-primary btn-block" id="ep-save">Salvar alterações</button>
    </div>`);
  const m = document.querySelector(".modal-overlay.open .modal");
  m.querySelector("[data-open-photo]").addEventListener("click", () => document.getElementById("ep-photo").click());
  m.querySelector("#ep-photo").addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      e.target.value = "";
      toast("Use uma imagem JPG, PNG ou WebP de até 2 MB.", "warning");
      return;
    }
    m.querySelector("#ep-photo-name").textContent = file.name;
  });
  m.querySelector("#ep-save").addEventListener("click", async e => {
    const name = document.getElementById("ep-name").value.trim();
    if (name.length < 2) { toast("Informe seu nome.", "warning"); return; }
    const button = e.currentTarget;
    button.disabled = true; button.textContent = "Salvando…";
    try {
      await DataAccess.updateProfile({ name });
      const photo = m.querySelector("#ep-photo").files[0];
      if (photo) appUser.profileImage = await DataAccess.uploadProfilePhoto(photo);
      appUser.name = name;
      toast("Perfil atualizado.", "success");
      closeModal();
      renderProfile();
    } catch (error) {
      button.disabled = false; button.textContent = "Salvar alterações";
      toast(error.message || "Erro ao atualizar perfil.", "error");
    }
  });
}

function openChangePassword() {
  openModal(`
    <div class="modal-head"><h3>Alterar senha</h3><button class="x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <p class="text-sm" style="color:var(--gray-500);margin-bottom:14px">Confirme sua senha atual para cadastrar uma nova.</p>
      <div class="field"><label>Senha atual</label><input type="password" id="cp-current" autocomplete="current-password" /></div>
      <div class="field"><label>Nova senha</label><input type="password" id="cp-pass" placeholder="Mínimo 6 caracteres" /></div>
      <div class="field"><label>Confirmar nova senha</label><input type="password" id="cp-pass2" placeholder="Repita a nova senha" /></div>
      <button class="btn btn-primary btn-block" id="cp-save">Salvar nova senha</button>
    </div>`);
  const m = document.querySelector(".modal-overlay.open .modal");
  m.querySelector("#cp-save").addEventListener("click", async e => {
    const current = document.getElementById("cp-current").value;
    const p1 = document.getElementById("cp-pass").value;
    const p2 = document.getElementById("cp-pass2").value;
    if (!current) { toast("Informe sua senha atual.", "warning"); return; }
    if (p1.length < 6) { toast("A senha deve ter pelo menos 6 caracteres.", "warning"); return; }
    if (p1 !== p2) { toast("As senhas não coincidem.", "warning"); return; }
    const button = e.currentTarget;
    button.disabled = true; button.textContent = "Atualizando…";
    try {
      await DataAccess.changePassword(current, p1);
      toast("Senha alterada com sucesso.", "success");
      closeModal();
    } catch (error) {
      button.disabled = false; button.textContent = "Salvar nova senha";
      toast(error.message || "Não foi possível alterar a senha.", "error");
    }
  });
}

async function doLogout() {
  const ok = await confirmModal({
    title: "Sair da conta",
    message: "Tem certeza de que deseja sair?",
    okText: "Sair", danger: true
  });
  if (!ok) return;
  await DataAccess.signOut();
  toast("Você saiu da sua conta.", "info");
  appUser = null;
  location.hash = "/";
  showLanding();
}
