// ============================================================================
// AURA - Configuração do Firebase
// ----------------------------------------------------------------------------
// 1) Acesse https://console.firebase.google.com
// 2) Seu projeto -> Configurações do projeto -> Seus apps -> App Web
// 3) Copie o objeto firebaseConfig e cole abaixo.
// 4) Ative no Firebase: Authentication (E-mail/Senha), Firestore, Storage,
//    e (opcional) Cloud Messaging.
// 5) No Firestore e no Storage, cole as regras de segurança indicadas na
//    seção "backend/rules" deste projeto.
//
// Enquanto as credenciais estiverem vazias, o aplicativo roda em MODO DEMO,
// usando dados de demonstração claramente identificados no rodapé.
// ============================================================================

window.AURA_FIREBASE_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

// Chave da Google Maps JavaScript API.
// Obtenha em https://console.cloud.google.com -> APIs e Serviços -> Credenciais
// Habilite a "Maps JavaScript API". Se vazio, usa o mapa de demonstração (Leaflet).
window.AURA_GOOGLE_MAPS_KEY = "";

// Prefixo/identificador para diferenciar dados de demonstração.
window.AURA_FIREBASE_ENABLED = false; // será atualizado automaticamente em runtime

// ============================================================================
// UTILITÁRIO: detecta se as credenciais foram preenchidas
// ============================================================================
(function () {
  var c = window.AURA_FIREBASE_CONFIG;
  window.AURA_FIREBASE_ENABLED = Boolean(
    c && c.apiKey && c.projectId && c.appId
  );
})();
