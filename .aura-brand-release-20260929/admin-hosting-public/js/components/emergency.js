// ============================================================================
// AURA - Contatos de emergência configurados pela administradora
// ============================================================================

async function openEmergencyModal() {
  let contacts;
  try { contacts = await DataAccess.publicEmergencyContacts(); }
  catch (error) { contacts = EMERGENCY_CONTACTS; }
  contacts = Array.isArray(contacts) ? contacts : EMERGENCY_CONTACTS;
  const rows = contacts.map(contact => {
    const number = String(contact.number || "").trim();
    const tel = number.replace(/[^0-9+]/g, "");
    if (!contact.name || !tel) return "";
    return `<a class="emergency-contact" href="tel:${esc(tel)}">
      <span><strong>${esc(contact.name)}</strong><small>${esc(number)}</small></span>
      <span class="emergency-call">Ligar</span>
    </a>`;
  }).join("");

  openModal(`
    <div class="modal-head"><h3>Ajuda e emergência</h3><button class="x" onclick="closeModal()" aria-label="Fechar">&times;</button></div>
    <div class="modal-body">
      <p class="text-sm text-muted">Toque em um número para iniciar a ligação pelo seu aparelho.</p>
      <div class="emergency-list">${rows || '<p class="text-sm text-muted">Nenhum contato configurado.</p>'}</div>
      <p class="text-sm text-muted emergency-note">A AURA não substitui os serviços de emergência.</p>
    </div>`);
}
