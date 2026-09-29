// ============================================================================
// AURA - Bootstrap da aplicação
// ============================================================================

let appUser = null;

async function startApp() {
  // Inicializa Firebase (ou entra em modo demo)
  const live = await initFirebase();
  document.dispatchEvent(new CustomEvent("aura:ready", { detail: { live } }));

  // Registra o Service Worker (PWA) somente sobre HTTP/HTTPS
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch(() => {});
    });
  }

  document.body.classList.remove("sidebar-open");

  // Verifica sessão / rota inicial
  const path = location.hash;
  if (path.startsWith("#/entrar") || path.startsWith("#/entrar/") || path === "#/entrar") {
    renderAuth(); authRenderLogin(); showAuthView(); return;
  }
  if (path.startsWith("#/cadastro")) {
    renderAuth(); authRenderSignup(); showAuthView(); return;
  }

  const user = await DataAccess.getCurrentUser();
  if (user) {
    appUser = user;
    renderAppShell();
    const key = handleHash();
    navigateTo(key);
  } else {
    appUser = null;
    renderLanding();
    // Rota explícita de autenticação? mostra login/cadastro. Senão landing.
    if (path && path.startsWith("#/")) {
      document.getElementById("view-landing").classList.remove("active");
      showAuthView();
      if (path.startsWith("#/cadastro")) authRenderSignup(); else authRenderLogin();
    } else {
      document.getElementById("view-landing").classList.add("active");
      document.getElementById("view-auth").classList.remove("active");
      document.getElementById("view-app").classList.remove("active");
    }
  }
}

// Inicializa ao carregar
window.addEventListener("DOMContentLoaded", async () => {
  renderLanding();
  document.getElementById("view-landing").classList.add("active");
  await startApp();
});

// Gerencia mudanças de hash (navegação)
window.addEventListener("hashchange", async () => {
  const path = location.hash;
  const user = await DataAccess.getCurrentUser();
  appUser = user;

  if (path.startsWith("#/entrar")) { renderAuth(); authRenderLogin(); showAuthView(); return; }
  if (path.startsWith("#/cadastro")) { renderAuth(); authRenderSignup(); showAuthView(); return; }
  if (!user) {
    renderLanding();
    if (!path || path === "#" || path === "#/" || path === "#/") { showLanding(); return; }
    showAuthView(); authRenderLogin(); return;
  }

  const key = handleHash();
  renderAppShell();
  navigateTo(key);
});
