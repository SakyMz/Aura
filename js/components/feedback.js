// ============================================================================
// AURA - Toast / Snackbar
// Uso: toast("Mensagem", "success"|"error"|"info"|"warning")
// ============================================================================
let _toastContainer = null;

function ensureToastContainer() {
  if (_toastContainer) return _toastContainer;
  _toastContainer = document.createElement("div");
  _toastContainer.className = "toast-container";
  document.body.appendChild(_toastContainer);
  return _toastContainer;
}

function toast(message, type, ms) {
  type = type || "info";
  const icons = {
    success: "checkCircle", error: "alert", info: "info", warning: "alert"
  };
  const el = document.createElement("div");
  el.className = "toast " + type;
  el.innerHTML =
    '<span class="t-ico">' + ICONS[icons[type]] + '</span>' +
    '<span class="t-txt">' + esc(message) + '</span>' +
    '<button class="t-close">&times;</button>';
  el.querySelector(".t-close").addEventListener("click", () => el.remove());
  ensureToastContainer().appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transition = "opacity .3s";
    setTimeout(() => el.remove(), 320);
  }, ms || 4200);
}

// ============================================================================
// AURA - Modal
// Uso: openModal(html, { onClose }). Fecha com openModal.close()
// ============================================================================
let _modalOverlay = null;
function _getModalOverlay() {
  if (_modalOverlay) return _modalOverlay;
  _modalOverlay = document.createElement("div");
  _modalOverlay.className = "modal-overlay";
  _modalOverlay.innerHTML = '<div class="modal"></div>';
  _modalOverlay.addEventListener("click", e => {
    if (e.target === _modalOverlay) closeModal();
  });
  document.body.appendChild(_modalOverlay);
  return _modalOverlay;
}

function openModal(html, opts) {
  opts = opts || {};
  const ov = _getModalOverlay();
  const m = ov.querySelector(".modal");
  m.innerHTML = html;
  ov.classList.add("open");
  if (opts.onClose) _modalOnClose = opts.onClose;
  return m;
}

let _modalOnClose = null;
function closeModal() {
  const ov = _getModalOverlay();
  ov.classList.remove("open");
  if (_modalOnClose) { _modalOnClose(); _modalOnClose = null; }
}

// Modal de confirmação
function confirmModal({ title, message, okText, cancelText, danger }) {
  return new Promise(resolve => {
    const m = openModal(
      '<div class="modal-head"><h3>' + esc(title) + '</h3></div>' +
      '<div class="modal-body">' +
        '<p class="text-sm" style="color:var(--gray-500)">' + message + '</p>' +
        '<div class="flex mt-4" style="gap:10px;justify-content:flex-end">' +
          '<button class="btn btn-secondary" data-cancel>Cancelar</button>' +
          '<button class="btn ' + (danger ? "btn-danger" : "btn-primary") + '" data-ok>' +
            esc(okText || "Confirmar") + '</button>' +
        '</div>' +
      '</div>', { onClose: () => resolve(false) }
    );
    m.querySelector("[data-cancel]").addEventListener("click", () => closeModal());
    m.querySelector("[data-ok]").addEventListener("click", () => {
      closeModal(); resolve(true);
    });
  });
}
