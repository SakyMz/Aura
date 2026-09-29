// ============================================================================
// AURA - Notificações
// Estrutura preparada para Firebase Cloud Messaging (FCM).
// No MVP web, exibimos uma lista de avisos de exemplo e um aviso de que o
// envio real será ativado com FCM.
// ============================================================================

const NOTIFICATIONS_DEMO = [
  {
    id: "n1", icon: "bell", title: "Há novos relatos próximos à sua região.",
    time: "há 12 min", kind: "info"
  },
  {
    id: "n2", icon: "alert", title: "Uma região próxima recebeu classificação de atenção alta.",
    time: "há 1 hora", kind: "warning"
  },
  {
    id: "n3", icon: "checkCircle", title: "Seu relato foi publicado.",
    time: "há 3 horas", kind: "success"
  }
];

function openNotificationsModal() {
  const fcmNote = isFirebaseLive()
    ? "Notificações por push (Firebase Cloud Messaging) serão ativadas na versão final."
    : "Você está vendo notificações de demonstração. O envio real via Firebase Cloud Messaging será ativado na versão final.";

  const items = NOTIFICATIONS_DEMO.map(n =>
    '<div class="notif-item"><span class="n-ico">' + ICONS[n.icon] + '</span>' +
    '<div><div class="n-title">' + esc(n.title) + '</div><div class="n-time">' + esc(n.time) + '</div></div>' +
    '</div>').join("");

  openModal(`
    <div class="modal-head"><h3>Notificações</h3><button class="x" onclick="closeModal()">&times;</button></div>
    <div class="modal-body">
      <div class="anon-callout" style="margin-top:0">${ICONS.info}
        <div style="font-size:12.5px">${fcmNote}</div>
      </div>
      ${items || '<div class="empty-state">' + ICONS['bell'] + '</div>'}
    </div>`);
}
