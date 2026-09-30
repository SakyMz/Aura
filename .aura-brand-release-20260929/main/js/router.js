// ============================================================================
// AURA - Router + Layout (header, sidebar, bottom nav)
// ============================================================================

const ROUTES = {
  home:    { path: "/",            label: "Início",  icon: "home", app: true },
  map:     { path: "/mapa",        label: "Mapa",    icon: "map", app: true },
  report:  { path: "/relatar",     label: "Relatar", icon: "plus", app: true },
  myreports:{path: "/meus-relatos",label: "Meus relatos", icon: "list", app: true },
  profile: { path: "/perfil",      label: "Perfil",  icon: "user", app: true }
};

const APP_KEYS = ["home", "map", "report", "myreports", "profile"];

let currentRoute = null;

// Renderiza os elementos de navegação fixos do app
function renderAppShell() {
  const shell = document.getElementById("app-shell");
  if (!shell) return;
  shell.innerHTML =
    sideBarHTML() +
    '<div class="app-column">' + headerHTML() + '<main id="app-main" class="app-main"></main></div>' +
    bottomNavHTML();
  bindNavEvents();
}

function sideBarHTML() {
  const items = APP_KEYS.map(k => {
    const r = ROUTES[k];
    return '<a href="#' + r.path + '" class="nav-item" data-route="' + k + '">' +
      '<span class="ni-ico">' + ICONS[r.icon] + '</span>' +
      '<span>' + r.label + '</span></a>';
  }).join("");
  return `
  <aside class="sidebar" id="sidebar">
    <a class="brand brand-full-logo" href="#/mapa" data-route="map" aria-label="AURA início">
      ${ICONS.logo}
    </a>
    <nav class="side-nav">${items}</nav>
    <div class="side-footer" id="side-footer"></div>
  </aside>`;
}

function headerHTML() {
  return `
  <header class="topbar" id="topbar">
    <button class="icon-btn" data-action="toggle-sidebar" aria-label="Menu">${ICONS.list}</button>
    <div class="topbar-title" id="topbar-title"></div>
    <div class="topbar-right">
      <button class="icon-btn" data-action="notifications" aria-label="Notificações">${ICONS.bell}</button>
      <button class="btn btn-danger btn-sm emergency-trigger" data-action="emergency">Ajuda</button>
    </div>
  </header>`;
}

function bottomNavHTML() {
  return `
  <nav class="bottom-nav" id="bottom-nav">
    ${APP_KEYS.map(k => {
      const r = ROUTES[k];
      return '<a href="#' + r.path + '" class="bn-item" data-route="' + k + '"' +
        (k === "report" ? ' data-highlight="1"' : "") + '>' +
        '<span class="bn-ico">' + ICONS[r.icon] + '</span>' +
        '<span class="bn-label">' + r.label + '</span></a>';
    }).join("")}
  </nav>`;
}

function bindNavEvents() {
  document.querySelectorAll("[data-route]").forEach(el => {
    el.addEventListener("click", e => {
      e.preventDefault();
      navigateTo(el.getAttribute("data-route"));
    });
  });
  const ts = document.querySelector("[data-action='toggle-sidebar']");
  if (ts) ts.addEventListener("click", () => document.body.classList.toggle("sidebar-open"));
  const nt = document.querySelector("[data-action='notifications']");
  if (nt) nt.addEventListener("click", () => openNotificationsModal());
  const emergency = document.querySelector("[data-action='emergency']");
  if (emergency) emergency.addEventListener("click", () => openEmergencyModal());
}

// Gerenciamento de rota (hash)
function handleHash() {
  const hash = location.hash.replace("#", "");
  let key = "home";
  if (hash.startsWith("/mapa")) key = "map";
  else if (hash.startsWith("/relatar")) key = "report";
  else if (hash.startsWith("/meus-relatos")) key = "myreports";
  else if (hash.startsWith("/perfil")) key = "profile";
  else if (hash.startsWith("/validacao")) key = "verify";
  else if (hash.startsWith("/admin")) key = "home";
  else key = "home";
  return key;
}

async function navigateTo(key) {
  // Garante sessão para rotas de app
  if (!(key === "landing" || key === "login" || key === "signup")) {
    const u = await DataAccess.getCurrentUser();
    if (!u) { showAuth(); return; }
    appUser = u;
    if (key !== "verify" && u.verificationStatus !== "approved") {
      key = "verify";
    }
  }

  const routes = {
    home: renderHome,
    map: renderMapPage,
    report: renderReportPage,
    myreports: renderMyReports,
    profile: renderProfile,
    verify: renderVerificationPage,
    login: showLogin,
    signup: showSignup,
    landing: showLanding
  };
  const fn = routes[key];
  if (!fn) return;

  currentRoute = key;
  activeView(key);

  if (APP_KEYS.includes(key)) {
    setActiveNav(key);
    setTopbarTitle(key);
    const main = document.getElementById("app-main");
    main.innerHTML = '<div class="loading-state"><div class="spinner"></div><p>Carregando...</p></div>';
    try {
      await fn();
    } catch (err) {
      console.error(err);
      main.innerHTML = errorStateHTML("Algo deu errado ao carregar esta tela.");
    }
  } else {
    await fn();
  }
}

function activeView(key) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  let v = document.getElementById("view-" + (key === "landing" ? "landing" : key === "login" ? "auth" : key === "signup" ? "auth" : key === "verify" ? "verify" : "app"));
  if (v) v.classList.add("active");
}

function setActiveNav(key) {
  document.querySelectorAll("[data-route]").forEach(el => {
    el.classList.toggle("active", el.getAttribute("data-route") === key);
  });
}

const TOPBAR_TITLES = {
  home: "Início",
  map: "Mapa da região",
  report: "Relatar situação",
  myreports: "Meus relatos",
  profile: "Meu perfil",
  verify: "Validação de acesso"
};
function setTopbarTitle(key) {
  const el = document.getElementById("topbar-title");
  if (el) el.textContent = TOPBAR_TITLES[key] || "";
}

// --- Telas de autenticação / landing ---
function showAuth() {
  document.getElementById("view-app").classList.remove("active");
  document.getElementById("view-landing").classList.remove("active");
  const authView = document.getElementById("view-auth");
  // Decidir login vs signup
  const wantSignup = location.hash.startsWith("#/cadastro");
  authView.classList.add("active");
  if (wantSignup) showSignup(); else showLogin();
}

function showAuthView() {
  document.getElementById("view-landing").classList.remove("active");
  document.getElementById("view-app").classList.remove("active");
  document.getElementById("view-auth").classList.add("active");
  // decide qual form
  const wantSignup = location.hash.startsWith("#/cadastro");
  if (wantSignup) authRenderSignup(); else authRenderLogin();
}

async function showLanding() {
  document.getElementById("view-auth").classList.remove("active");
  document.getElementById("view-app").classList.remove("active");
  document.getElementById("view-landing").classList.add("active");
}

// helpers de estado vazio/erro/loading
function errorStateHTML(msg) {
  return '<div class="error-state"><span class="ico">' + ICONS.alert + '</span>' +
    '<h3>Ocorreu um erro</h3><p>' + esc(msg || "Tente novamente.") + '</p></div>';
}
function emptyStateHTML(iconName, title, msg) {
  return '<div class="empty-state"><span class="ico">' + ICONS[iconName] + '</span>' +
    '<h3>' + esc(title) + '</h3><p>' + esc(msg || "") + '</p></div>';
}

