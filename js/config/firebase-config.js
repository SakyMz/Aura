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
// Configuração do app Web Aura no Firebase.
// ============================================================================

window.AURA_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBlfTvLiFeheHRAM4CXagyXCRtxQ1CU_1g",
  authDomain: "aura-44ef6.firebaseapp.com",
  projectId: "aura-44ef6",
  storageBucket: "aura-44ef6.firebasestorage.app",
  messagingSenderId: "782764547431",
  appId: "1:782764547431:web:19d0b73baa5038beb5a3c2",
  measurementId: "G-SSL5DV9XKB"
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
