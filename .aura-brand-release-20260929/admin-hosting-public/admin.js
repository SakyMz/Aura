const privateRoot = document.getElementById("private-root");
const privateLogout = document.getElementById("private-logout");

async function privateIsAdmin(uid) {
  if (!isFirebaseLive() || !uid) return false;
  const snapshot = await DB.db.collection("users").doc(uid).get();
  return snapshot.exists && snapshot.data().role === "admin";
}

async function privateAssertAdmin() {
  const user = await DataAccess.getCurrentUser();
  if (!user || !(await privateIsAdmin(user.id))) throw new Error("Acesso restrito à administradora.");
  return user;
}

async function privateListVerifications() {
  await privateAssertAdmin();
  const snapshot = await DB.db.collection("users").where("verificationStatus", "==", "pending").get();
  return snapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
}

async function privateDocumentUrl(uid) {
  await privateAssertAdmin();
  const snapshot = await DB.db.collection("users").doc(uid).get();
  if (!snapshot.exists || !snapshot.data().verificationDocumentPath) throw new Error("Documento não encontrado.");
  return DB.storage.ref(snapshot.data().verificationDocumentPath).getDownloadURL();
}

async function privateReviewVerification(uid, decision, note) {
  await privateAssertAdmin();
  if (!["approved", "rejected"].includes(decision)) throw new Error("Decisão inválida.");
  const ref = DB.db.collection("users").doc(uid);
  const snapshot = await ref.get();
  if (!snapshot.exists) throw new Error("Conta não encontrada.");
  await ref.update({
    verificationStatus: decision,
    verificationReviewedAt: new Date().toISOString(),
    verificationReviewNote: String(note || "").trim().slice(0, 300)
  });
  let imageDeleted = true;
  const path = snapshot.data().verificationDocumentPath;
  if (path) {
    try { await DB.storage.ref(path).delete(); }
    catch (error) { imageDeleted = false; console.warn("Não foi possível apagar a foto do documento.", error); }
  }
  return { imageDeleted };
}

async function privateListPendingReports() {
  await privateAssertAdmin();
  const snapshot = await DB.db.collection("reports").where("status", "==", "pending").get();
  return snapshot.docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
}

async function privateSetReportStatus(id, status) {
  await privateAssertAdmin();
  if (!["published", "removed"].includes(status)) throw new Error("Status inválido.");
  await DB.db.collection("reports").doc(id).update({ status });
}

async function privateEmergencyContacts() {
  await privateAssertAdmin();
  const snapshot = await DB.db.collection("settings").doc("emergency").get();
  return snapshot.exists && Array.isArray(snapshot.data().contacts) ? snapshot.data().contacts : EMERGENCY_CONTACTS;
}

async function privateSaveEmergencyContacts(contacts) {
  await privateAssertAdmin();
  await DB.db.collection("settings").doc("emergency").set({ contacts, updatedAt: new Date().toISOString() });
}

function privateNotice(message, error) {
  privateRoot.innerHTML = `<div class="private-message${error ? " private-error" : ""}">${message}</div>`;
}

async function privateStart() {
  if (!window.AURA_FIREBASE_ENABLED) {
    privateNotice("Preencha primeiro js/config/firebase-config.js e configure Authentication, Firestore e Storage.", true);
    return;
  }
  await initFirebase();
  const user = await DataAccess.getCurrentUser();
  if (user && await privateIsAdmin(user.id)) return privateDashboard();
  privateLogin();
}

function privateLogin() {
  privateRoot.innerHTML = `<h2>Entrar como administradora</h2>
    <p>Use a conta que recebeu o campo <code>role: "admin"</code> no Firebase.</p>
    <form id="private-login">
      <div class="field"><label for="private-email">E-mail</label><input id="private-email" type="email" autocomplete="username" required /></div>
      <div class="field"><label for="private-password">Senha</label><input id="private-password" type="password" autocomplete="current-password" required /></div>
      <button class="btn btn-primary" type="submit">Entrar</button>
      <p id="private-login-error" class="text-sm" role="alert"></p>
    </form>`;
  document.getElementById("private-login").addEventListener("submit", async event => {
    event.preventDefault();
    const errorNode = document.getElementById("private-login-error");
    try {
      await DataAccess.signIn(document.getElementById("private-email").value.trim(), document.getElementById("private-password").value);
      const user = await DataAccess.getCurrentUser();
      if (!user || !(await privateIsAdmin(user.id))) {
        await DataAccess.signOut();
        throw new Error("Esta conta não está autorizada como administradora.");
      }
      privateDashboard();
    } catch (error) { errorNode.textContent = error.message || "Falha ao entrar."; }
  });
}

async function privateDashboard() {
  privateLogout.classList.remove("hidden");
  privateRoot.innerHTML = `<h1>Painel privado</h1>
    <nav class="private-tabs" aria-label="Seções do painel">
      <button data-tab="verifications" class="active">Validação de contas</button>
      <button data-tab="reports">Relatos</button>
      <button data-tab="emergency">Números de emergência</button>
    </nav><section id="private-content"></section>`;
  document.querySelectorAll("[data-tab]").forEach(button => button.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach(item => item.classList.toggle("active", item === button));
    if (button.dataset.tab === "verifications") privateVerifications();
    if (button.dataset.tab === "reports") privateReports();
    if (button.dataset.tab === "emergency") privateEmergency();
  }));
  privateVerifications();
}

function privateContent() { return document.getElementById("private-content"); }
async function privateVerifications() {
  const target = privateContent();
  target.innerHTML = "Carregando contas pendentes…";
  try {
    const users = await privateListVerifications();
    if (!users.length) { target.innerHTML = '<div class="private-message">Não há contas aguardando validação.</div>'; return; }
    target.innerHTML = "";
    for (const user of users) {
      const card = document.createElement("article");
      card.className = "private-card";
      card.innerHTML = `<div class="private-row"><div><h2>${escapePrivate(user.name || "Conta sem nome")}</h2>
        <p>${escapePrivate(user.email || "")} · Enviado em ${escapePrivate(user.verificationSubmittedAt || "")}</p>
        <p>Confira visualmente se a imagem do documento e o rosto estão nítidos e correspondem à pessoa cadastrada. A validação é manual.</p>
        <label class="field"><span>Observação para a usuária (se recusar)</span><textarea data-note rows="3" maxlength="300" placeholder="O que precisa ser corrigido?"></textarea></label>
        <div class="private-actions"><button class="btn btn-primary" data-approve disabled>Aprovar conta</button><button class="btn btn-secondary" data-reject>Recusar e pedir nova foto</button></div></div>
        <div><img class="private-id" alt="Documento enviado para validação" /><p data-image-status class="text-sm text-muted">Carregando imagem privada…</p></div></div>`;
      target.appendChild(card);
      try {
        const url = await privateDocumentUrl(user.id);
        const image = card.querySelector(".private-id");
        image.onload = () => {
          card.querySelector("[data-image-status]").textContent = "Imagem privada carregada para análise.";
          card.querySelector("[data-approve]").disabled = false;
        };
        image.onerror = () => {
          card.querySelector("[data-image-status]").textContent = "Não foi possível abrir a imagem. Peça novo envio antes de aprovar.";
        };
        image.src = url;
      } catch (error) {
        card.querySelector("[data-image-status]").textContent = "Imagem não encontrada. Peça novo envio antes de aprovar.";
        card.querySelector("[data-approve]").disabled = true;
      }
      card.querySelector("[data-approve]").addEventListener("click", () => privateReviewUser(card, user, "approved"));
      card.querySelector("[data-reject]").addEventListener("click", () => privateReviewUser(card, user, "rejected"));
    }
  } catch (error) { target.innerHTML = `<div class="private-message private-error">${escapePrivate(error.message)}</div>`; }
}

async function privateReviewUser(card, user, decision) {
  const note = card.querySelector("[data-note]").value.trim();
  if (decision === "rejected" && !note) { alert("Escreva uma observação para orientar o novo envio."); return; }
  const buttons = card.querySelectorAll("button");
  buttons.forEach(button => button.disabled = true);
  try {
    const result = await privateReviewVerification(user.id, decision, note);
    card.remove();
    if (!result.imageDeleted) alert("A decisão foi salva, mas a foto não pôde ser apagada automaticamente. Exclua-a manualmente no Firebase Storage.");
    if (!privateContent().querySelector(".private-card")) {
      privateContent().innerHTML = result.imageDeleted
        ? '<div class="private-message">Análise concluída. A foto do documento foi removida do Storage.</div>'
        : '<div class="private-message private-error">Análise concluída, mas a foto precisa ser removida manualmente no Firebase Storage.</div>';
    }
  } catch (error) {
    buttons.forEach(button => button.disabled = false);
    alert(error.message || "Não foi possível salvar a análise.");
  }
}

async function privateReports() {
  const target = privateContent();
  target.innerHTML = "Carregando relatos pendentes…";
  try {
    const reports = await privateListPendingReports();
    if (!reports.length) { target.innerHTML = '<div class="private-message">Não há relatos aguardando análise.</div>'; return; }
    target.innerHTML = "";
    reports.forEach(report => {
      const card = document.createElement("article");
      card.className = "private-card";
      const mapLink = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(report.latitude)}&mlon=${encodeURIComponent(report.longitude)}#map=16/${encodeURIComponent(report.latitude)}/${encodeURIComponent(report.longitude)}`;
      card.innerHTML = `<h2>${escapePrivate(report.category || "Relato")}</h2>
        <p>${escapePrivate(report.description || "")}</p>
        <p><a target="_blank" rel="noopener" href="${mapLink}">Ver localização no mapa</a> · ${escapePrivate(report.riskLevel || "attention")}</p>
        <div class="private-actions"><button class="btn btn-primary" data-approve>Publicar</button><button class="btn btn-danger" data-reject>Recusar</button></div>`;
      target.appendChild(card);
      card.querySelector("[data-approve]").addEventListener("click", () => privateReviewReport(card, report.id, "published"));
      card.querySelector("[data-reject]").addEventListener("click", () => privateReviewReport(card, report.id, "removed"));
    });
  } catch (error) { target.innerHTML = `<div class="private-message private-error">${escapePrivate(error.message)}</div>`; }
}

async function privateReviewReport(card, id, status) {
  const buttons = card.querySelectorAll("button"); buttons.forEach(button => button.disabled = true);
  try { await privateSetReportStatus(id, status); card.remove(); }
  catch (error) { buttons.forEach(button => button.disabled = false); alert(error.message || "Falha ao atualizar relato."); }
}

async function privateEmergency() {
  const target = privateContent();
  target.innerHTML = "Carregando contatos…";
  try {
    const contacts = await privateEmergencyContacts();
    target.innerHTML = `<h2>Contatos exibidos no app de usuárias</h2>
      <p>Use números públicos de atendimento. Os contatos salvos aparecem no botão Ajuda do Aura.</p>
      <form id="emergency-form"><div id="emergency-rows"></div>
        <div class="private-actions"><button type="button" class="btn btn-secondary" id="add-emergency">Adicionar número</button><button class="btn btn-primary" type="submit">Salvar números</button></div>
      </form>`;
    const rows = document.getElementById("emergency-rows");
    const addRow = contact => {
      const row = document.createElement("div"); row.className = "contact-row";
      row.innerHTML = `<input aria-label="Nome do serviço" placeholder="Serviço" value="${escapePrivate(contact.name || "")}" maxlength="70" />
        <input aria-label="Telefone" placeholder="Número com DDD" value="${escapePrivate(contact.number || "")}" maxlength="24" />
        <button type="button" class="btn btn-ghost" aria-label="Remover contato">Remover</button>`;
      row.querySelector("button").addEventListener("click", () => row.remove());
      rows.appendChild(row);
    };
    contacts.forEach(addRow);
    document.getElementById("add-emergency").addEventListener("click", () => addRow({ name:"", number:"" }));
    document.getElementById("emergency-form").addEventListener("submit", async event => {
      event.preventDefault();
      const values = [...rows.querySelectorAll(".contact-row")].map(row => ({
        name: row.children[0].value.trim(), number: row.children[1].value.trim()
      })).filter(contact => contact.name && contact.number);
      if (!values.length) { alert("Cadastre pelo menos um contato."); return; }
      try {
        await privateSaveEmergencyContacts(values);
        alert("Números salvos; eles aparecerão no app após a atualização da tela.");
      } catch (error) { alert(error.message || "Não foi possível salvar os números."); }
    });
  } catch (error) { target.innerHTML = `<div class="private-message private-error">${escapePrivate(error.message)}</div>`; }
}

function escapePrivate(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, char => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  }[char]));
}

privateLogout.addEventListener("click", async () => { await DataAccess.signOut(); privateLogin(); });
privateStart();
