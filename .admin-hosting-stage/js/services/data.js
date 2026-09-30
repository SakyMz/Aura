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
  authReady: null,
  googleMapsKey: window.AURA_GOOGLE_MAPS_KEY || ""
};

// Usa o bucket exatamente como fornecido pelo Firebase Console.
function normalizedConfig() {
  const c = Object.assign({}, window.AURA_FIREBASE_CONFIG);
  if (!c.storageBucket) throw new Error("Preencha storageBucket com o valor exato do Firebase Console.");
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
      DB.authReady = new Promise(resolve => DB.auth.onAuthStateChanged(resolve));
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
  return null;
}

// ============================================================================
// Demo repository - dados de demonstração claramente identificados
// ============================================================================

// Gera um id curto
function shortId() {
  return "demo_" + Math.random().toString(36).slice(2, 9);
}

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
      if (DB.authReady) await DB.authReady;
      const user = DB.auth.currentUser;
      if (!user) return null;
      // busca doc em users
      try {
        const snap = await DB.db.collection("users").doc(user.uid).get();
        if (snap.exists) {
          return { id: user.uid, email: user.email, ...snap.data() };
        }
        return { id: user.uid, email: user.email, name: user.displayName || "", verificationStatus: "pending" };
      } catch (e) {
        console.warn(e);
        return { id: user.uid, email: user.email };
      }
    }
    return null;
  },

  async signIn(email, password) {
    if (isFirebaseLive()) {
      await DB.auth.signInWithEmailAndPassword(email, password);
      return DB.auth.currentUser;
    }
    throw new Error("A autenticação ainda não está configurada. A conta real será ativada quando o Firebase estiver conectado.");
  },

  async signUp(name, email, password, verificationPhoto) {
    if (!isFirebaseLive()) throw new Error("O cadastro real será liberado assim que a conexão com Firebase estiver configurada.");
    if (!verificationPhoto) throw new Error("Anexe uma foto legível do documento com o rosto visível.");

    const cred = await DB.auth.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    const now = new Date().toISOString();
    const path = "verifications/" + uid + "/document";
    try {
      await cred.user.updateProfile({ displayName: name });
      await DB.db.collection("users").doc(uid).set({
        name, email, profileImage: "", createdAt: now, updatedAt: now,
        verificationStatus: "pending", verificationDocumentPath: path,
        verificationSubmittedAt: now, emergencyContacts: [], selfDeclaredWoman: true
      });
    } catch (error) {
      try { await cred.user.delete(); } catch (cleanupError) { console.warn("Não foi possível remover a conta incompleta.", cleanupError); }
      throw error;
    }
    try {
      await DB.storage.ref(path).put(verificationPhoto);
    } catch (error) {
      error.code = error.code || "aura/verification-upload-failed";
      throw error;
    }
    return { id: uid, email, name, verificationStatus: "pending" };
  },

  async signOut() {
    if (isFirebaseLive() && DB.auth.currentUser) await DB.auth.signOut();
  },

  async sendPasswordReset(email) {
    if (!isFirebaseLive()) throw new Error("A recuperação de senha será ativada quando o Firebase estiver conectado.");
    await DB.auth.sendPasswordResetEmail(email);
  },

  async uploadVerificationDocument(file) {
    if (!isFirebaseLive() || !DB.auth.currentUser) throw new Error("Entre na sua conta para enviar o documento.");
    const uid = DB.auth.currentUser.uid;
    const snap = await DB.db.collection("users").doc(uid).get();
    if (!snap.exists || !["pending", "rejected"].includes(snap.data().verificationStatus)) {
      throw new Error("Não é possível substituir o documento neste estado da análise.");
    }
    const path = "verifications/" + uid + "/document";
    await DB.storage.ref(path).put(file);
    await DB.db.collection("users").doc(uid).update({
      verificationStatus: "pending",
      verificationDocumentPath: path,
      verificationSubmittedAt: new Date().toISOString(),
      verificationReviewNote: "",
      updatedAt: new Date().toISOString()
    });
  },

  async updateProfile(data) {
    if (!isFirebaseLive() || !DB.auth.currentUser) throw new Error("Entre na sua conta para editar o perfil.");
    await DB.db.collection("users").doc(DB.auth.currentUser.uid).update({
      name: data.name,
      updatedAt: new Date().toISOString()
    });
    await DB.auth.currentUser.updateProfile({ displayName: data.name });
    return this.getCurrentUser();
  },

  async uploadProfilePhoto(file) {
    if (!isFirebaseLive() || !DB.auth.currentUser) throw new Error("Entre na sua conta para atualizar a foto.");
    if (!file || !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
      throw new Error("Use uma imagem JPG, PNG ou WebP de até 2 MB.");
    }
    const path = "profiles/" + DB.auth.currentUser.uid + "/profile";
    const ref = DB.storage.ref(path);
    await ref.put(file);
    const profileImage = await ref.getDownloadURL();
    await DB.db.collection("users").doc(DB.auth.currentUser.uid).update({
      profileImage,
      updatedAt: new Date().toISOString()
    });
    await DB.auth.currentUser.updateProfile({ photoURL: profileImage });
    return profileImage;
  },

  async changePassword(currentPassword, newPassword) {
    if (!isFirebaseLive() || !DB.auth.currentUser) throw new Error("Entre na sua conta para alterar a senha.");
    const user = DB.auth.currentUser;
    const credential = window.firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
  },

  async publicEmergencyContacts() {
    if (isFirebaseLive()) {
      const snap = await DB.db.collection("settings").doc("emergency").get();
      if (snap.exists && Array.isArray(snap.data().contacts)) return snap.data().contacts;
    }
    return EMERGENCY_CONTACTS;
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
      const path = "reports/" + uid + "/" + Date.now() + "_" + String(file.name || "foto").replace(/[^a-zA-Z0-9._-]/g, "_");
      const ref = DB.storage.ref(path);
      await ref.put(file);
      return await ref.getDownloadURL();
    }
    // Em demo, não conseguimos subir imagem de verdade. Retorna vazio
    // e o app avisa que a foto fica apenas na sessão local.
    return null;
  },

};

// Mapa da chave do Google Maps (exposto para o módulo de mapas)
window.__AURA_DB = DB;
