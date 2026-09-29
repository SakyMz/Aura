// ============================================================================
// AURA - Serviço de dados (Firebase Firestore + Auth)
// ----------------------------------------------------------------------------
// Arquitetura: DataAccess permite alternar entre dados reais do Firebase
// e dados de demonstração (mock), O firebase-config.js define se o Firebase
// está habilitado. Quando desabilitado, usa o DemoRepository abaixo.
// ============================================================================

let DB = {
  auth: null,
  db: null,
  storage: null,
  googleMapsKey: window.AURA_GOOGLE_MAPS_KEY || ""
};

// Extrai o domínio do projectId para construir storageBucket, se vazio
function normalizedConfig() {
  const c = Object.assign({}, window.AURA_FIREBASE_CONFIG);
  if (!c.storageBucket && c.projectId) {
    c.storageBucket = c.projectId + ".appspot.com";
  }
  return c;
}

// Inicializa o Firebase (chamado uma vez). Retorna true se ativo.
async function initFirebase() {
  if (DB.firebaseReady) return DB.firebaseEnabled;
  DB.firebaseEnabled = window.AURA_FIREBASE_ENABLED;

  if (DB.firebaseEnabled) {
    try {
      const app = window.firebase.initializeApp(normalizedConfig());
      DB.auth = window.firebase.auth(app);
      DB.db = window.firebase.firestore(app);
      DB.storage = window.firebase.storage(app);
      DB.db.settings({ ignoreUndefinedProperties: true });
      DB.firebaseReady = true;
    } catch (e) {
      console.warn("AURA: Falha ao inicializar Firebase. Usando modo demo.", e);
      DB.firebaseEnabled = false;
      DB.firebaseReady = true;
    }
  } else {
    DB.firebaseReady = true;
  }
  return DB.firebaseEnabled;
}

function isFirebaseLive() {
  return DB.firebaseEnabled && DB.firebaseReady && !!DB.db;
}

function getCurrentUid() {
  if (DB.auth && DB.auth.currentUser) return DB.auth.currentUser.uid;
  return localStorage.getItem("aura_demo_uid");
}

// ============================================================================
// Demo repository - dados de demonstração claramente identificados
// ============================================================================

// Gera um id curto
function shortId() {
  return "demo_" + Math.random().toString(36).slice(2, 9);
}

const DEMO_USER = {
  id: "demo_user_1",
  name: "Marina",
  email: "marina@demo.aura",
  profileImage: "",
  createdAt: new Date().toISOString()
};

function baseDemoReports() {
  const now = Date.now();
  const H = 3600e3;
  return [
    {
      id: "demo_1", userId: "demo_user_1", category: "abordagem",
      description: "Abordagem suspeita por dois homens em moto próximo à saída da estação. Sempre à noite na região.",
      latitude: -23.5505, longitude: -46.6333, riskLevel: "high",
      date: new Date(now - 2 * H).toISOString(),
      createdAt: new Date(now - 2 * H).toISOString(),
      imageUrl: "", status: "published", anonymous: true,
      relatedCount: 2
    },
    {
      id: "demo_2", userId: "demo_user_2", category: "iluminação",
      description: "Trecho da rua sem iluminação pública há semanas. Passagem muito escura após às 18h.",
      latitude: -23.5525, longitude: -46.6365, riskLevel: "attention",
      date: new Date(now - 6 * H).toISOString(),
      createdAt: new Date(now - 6 * H).toISOString(),
      imageUrl: "", status: "published", anonymous: true,
      relatedCount: 1
    },
    {
      id: "demo_3", userId: "demo_user_3", category: "assédio",
      description: "Assédio verbal na calçada em frente ao supermercado, em horário de pico.",
      latitude: -23.5478, longitude: -46.6302, riskLevel: "moderate",
      date: new Date(now - 1 * 24 * H).toISOString(),
      createdAt: new Date(now - 1 * 24 * H).toISOString(),
      imageUrl: "", status: "published", anonymous: true,
      relatedCount: 4
    },
    {
      id: "demo_4", userId: "demo_user_4", category: "roubo",
      description: "Furto de celular na região da praça durante evento. Fique atenta a carteiristas.",
      latitude: -23.5548, longitude: -46.6290, riskLevel: "high",
      date: new Date(now - 3 * 24 * H).toISOString(),
      createdAt: new Date(now - 3 * 24 * H).toISOString(),
      imageUrl: "", status: "published", anonymous: true,
      relatedCount: 3
    },
    {
      id: "demo_5", userId: "demo_user_2", category: "trânsito",
      description: "Ponto de ônibus com histórico de arremesso de objetos de veículos em alta velocidade.",
      latitude: -23.5490, longitude: -46.6400, riskLevel: "attention",
      date: new Date(now - 5 * 24 * H).toISOString(),
      createdAt: new Date(now - 5 * 24 * H).toISOString(),
      imageUrl: "", status: "closed", anonymous: true,
      relatedCount: 1
    }
  ];
}

// ============================================================================
// DataAccess API (usada pelas telas)
// ============================================================================
const DataAccess = {
  // --- Autenticação ---
  async getCurrentUser() {
    if (isFirebaseLive()) {
      const user = DB.auth.currentUser;
      if (!user) return null;
      // busca doc em users
      try {
        const snap = await DB.db.collection("users").doc(user.uid).get();
        if (snap.exists) {
          return { id: user.uid, email: user.email, ...snap.data() };
        }
        return { id: user.uid, email: user.email, name: user.displayName || "" };
      } catch (e) {
        console.warn(e);
        return { id: user.uid, email: user.email };
      }
    }
    // Modo demo: só está "logada" se tiver feito login/cadastro na sessão
    if (localStorage.getItem("aura_demo_uid")) {
      return Object.assign({}, DEMO_USER);
    }
    return null;
  },

  async signIn(email, password) {
    if (isFirebaseLive()) {
      await DB.auth.signInWithEmailAndPassword(email, password);
      return DB.auth.currentUser;
    }
    if (email && password) {
      localStorage.setItem("aura_demo_uid", "demo_user_1");
      DEMO_USER.email = email;
      return Object.assign({}, DEMO_USER);
    }
    throw new Error("Credenciais inválidas");
  },

  async signUp(name, email, password) {
    if (isFirebaseLive()) {
      const cred = await DB.auth.createUserWithEmailAndPassword(email, password);
      const uid = cred.user.uid;
      const now = new Date().toISOString();
      await cred.user.updateProfile({ displayName: name });
      await DB.db.collection("users").doc(uid).set({
        name, email, profileImage: "", createdAt: now, updatedAt: now
      });
      return cred.user;
    }
    DEMO_USER.name = name; DEMO_USER.email = email;
    localStorage.setItem("aura_demo_uid", "demo_user_1");
    return Object.assign({}, DEMO_USER);
  },

  async signOut() {
    if (isFirebaseLive()) {
      await DB.auth.signOut();
    } else {
      localStorage.removeItem("aura_demo_uid");
    }
  },

  async sendPasswordReset(email) {
    if (isFirebaseLive()) {
      await DB.auth.sendPasswordResetEmail(email);
    }
    // em demo apenas simula sucesso
  },

  // --- Relatos ---
  async listReports(opts) {
    opts = opts || {};
    if (isFirebaseLive()) {
      let q = DB.db.collection("reports").where("status", "==", "published");
      const snap = await q.get();
      const out = [];
      snap.forEach(d => out.push(Object.assign({ id: d.id }, d.data())));
      return out;
    }
    return baseDemoReports();
  },

  async listMyReports(userId) {
    if (isFirebaseLive()) {
      const uid = userId || getCurrentUid();
      const snap = await DB.db.collection("reports")
        .where("userId", "==", uid)
        .orderBy("createdAt", "desc").get();
      const out = [];
      snap.forEach(d => out.push(Object.assign({ id: d.id }, d.data())));
      return out;
    }
    // Em demo, cria um relato "minha" para a sessão se não existir
    const mine = baseDemoReports().filter(r => r.userId === getCurrentUid());
    return mine.map(r => {
      if (r.status === "published") r.status = "pending";
      return r;
    });
  },

  async createReport(data) {
    if (isFirebaseLive()) {
      const uid = DB.auth.currentUser ? DB.auth.currentUser.uid : getCurrentUid();
      const doc = {
        userId: uid,
        category: data.category,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        riskLevel: data.riskLevel,
        date: data.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        imageUrl: data.imageUrl || "",
        status: "pending",
        anonymous: data.anonymous !== false
      };
      const ref = await DB.db.collection("reports").add(doc);
      return Object.assign({ id: ref.id }, doc);
    }
    return Object.assign({
      id: shortId(),
      userId: getCurrentUid(),
      category: data.category,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      riskLevel: data.riskLevel,
      date: data.date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      imageUrl: data.imageUrl || "",
      status: "pending",
      anonymous: data.anonymous !== false,
      relatedCount: 1
    });
  },

  async uploadImage(file) {
    if (isFirebaseLive() && DB.storage) {
      const uid = DB.auth.currentUser ? DB.auth.currentUser.uid : getCurrentUid();
      const path = "reports/" + uid + "/" + Date.now() + "_" + file.name;
      const ref = DB.storage.ref(path);
      await ref.put(file);
      return await ref.getDownloadURL();
    }
    // Em demo, não conseguimos subir imagem de verdade. Retorna vazio
    // e o app avisa que a foto fica apenas na sessão local.
    return null;
  },

  // --- Admin ---
  async isAdmin(uid) {
    // Em demo, o usuário demo é admin.
    if (!isFirebaseLive()) return true;
    try {
      const snap = await DB.db.collection("users").doc(uid).get();
      return !!(snap.exists && snap.data().role === "admin");
    } catch (e) {
      console.warn(e);
      return false;
    }
  },

  async adminStats() {
    if (isFirebaseLive()) {
      const users = await DB.db.collection("users").get();
      const reports = await DB.db.collection("reports").get();
      let pending = 0, published = 0;
      const cats = {};
      reports.forEach(d => {
        const st = d.data().status;
        if (st === "pending") pending++;
        if (st === "published") published++;
        const c = d.data().category || "outro";
        cats[c] = (cats[c] || 0) + 1;
      });
      return {
        totalUsers: users.size,
        totalReports: reports.size,
        pending, published,
        categories: cats
      };
    }
    const reports = baseDemoReports();
    return {
      totalUsers: 128,
      totalReports: reports.length,
      pending: 7,
      published: reports.length,
      categories: {
        "assédio": 12, "roubo": 9, "abordagem": 8, "iluminação": 6,
        "trânsito": 4, "violência": 3, "outro": 2
      }
    };
  },

  async adminListPending() {
    if (isFirebaseLive()) {
      const snap = await DB.db.collection("reports")
        .where("status", "==", "pending").limit(100).get();
      const out = [];
      snap.forEach(d => out.push(Object.assign({ id: d.id }, d.data())));
      return out;
    }
    // Demo: gera alguns relatos pendentes
    const now = Date.now();
    return [
      {
        id: "pend_1", userId: "u_x", category: "assédio",
        description: "[DEMONSTRAÇÃO] Assédio relatado no ponto de ônibus perto da perfumaria.",
        latitude: -23.5511, longitude: -46.6341, riskLevel: "high",
        createdAt: new Date(now - 1e4).toISOString(), status: "pending", anonymous: true
      },
      {
        id: "pend_2", userId: "u_y", category: "iluminação",
        description: "[DEMONSTRAÇÃO] Lâmpadas queimadas na viela de acesso ao condomínio.",
        latitude: -23.5560, longitude: -46.6380, riskLevel: "attention",
        createdAt: new Date(now - 2e4).toISOString(), status: "pending", anonymous: true
      }
    ];
  },

  async adminSetStatus(reportId, status) {
    if (isFirebaseLive()) {
      await DB.db.collection("reports").doc(reportId).update({ status });
    }
  }
};

// Mapa da chave do Google Maps (exposto para o módulo de mapas)
window.__AURA_DB = DB;
