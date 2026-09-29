// ============================================================================
// AURA - Login e Cadastro (Firebase Auth)
// ============================================================================

let authMode = "login"; // "login" | "signup"

function renderAuth() {
  const root = document.getElementById("auth-root");
  root.innerHTML = `
    <div class="auth-card">
      <a class="auth-back" href="#/" data-goto="landing">${ICONS.arrowLeft} Voltar ao início</a>
      <span class="brand">
        <span class="brand-mark">${ICONS.logo}</span>
        <span class="brand-name">AURA</span>
      </span>
      <div id="auth-body"></div>
    </div>`;
  root.querySelector("[data-goto='landing']").addEventListener("click", e => {
    e.preventDefault(); showLanding(); location.hash = "/";
  });
}

function authRenderLogin() {
  authMode = "login";
  const body = document.getElementById("auth-body");
  body.innerHTML = `
    <h2>Bem-vinda de volta</h2>
    <p class="auth-sub">Entre para explorar sua região com mais segurança.</p>
    <form id="login-form" novalidate>
      <div class="field">
        <label for="li-email">E-mail</label>
        <input id="li-email" type="email" autocomplete="email" placeholder="seuemail@exemplo.com" required />
      </div>
      <div class="field">
        <label for="li-pass">Senha</label>
        <div class="pw-row">
          <input id="li-pass" type="password" autocomplete="current-password" placeholder="••••••••" required />
          <button type="button" class="pw-toggle" data-toggle="li-pass">${ICONS.eye}</button>
        </div>
      </div>
      <div class="flex" style="justify-content:flex-end;margin-bottom:18px">
        <a href="#" id="l-forgot" class="text-sm" style="color:var(--aura-600)">Esqueci minha senha</a>
      </div>
      <button type="submit" class="btn btn-primary btn-block btn-lg" id="l-submit">Entrar</button>
    </form>
    <div class="auth-footer">
      Ainda não tem conta? <a href="#/cadastro" data-goto="signup"><strong style="color:var(--aura-600)">Criar conta</strong></a>
    </div>`;
  bindAuthEvents(body);
}

function authRenderSignup() {
  authMode = "signup";
  const body = document.getElementById("auth-body");
  body.innerHTML = `
    <h2>Criar conta</h2>
    <p class="auth-sub">Junte-se à comunidade AURA.</p>
    <form id="signup-form" novalidate>
      <div class="field">
        <label for="su-name">Nome</label>
        <input id="su-name" type="text" autocomplete="name" placeholder="Seu nome" required />
      </div>
      <div class="field">
        <label for="su-email">E-mail</label>
        <input id="su-email" type="email" autocomplete="email" placeholder="seuemail@exemplo.com" required />
      </div>
      <div class="field">
        <label for="su-pass">Senha</label>
        <div class="pw-row">
          <input id="su-pass" type="password" autocomplete="new-password" placeholder="Mínimo 6 caracteres" required />
          <button type="button" class="pw-toggle" data-toggle="su-pass">${ICONS.eye}</button>
        </div>
      </div>
      <div class="field">
        <label for="su-pass2">Confirmar senha</label>
        <div class="pw-row">
          <input id="su-pass2" type="password" autocomplete="new-password" placeholder="Repita a senha" required />
          <button type="button" class="pw-toggle" data-toggle="su-pass2">${ICONS.eye}</button>
        </div>
      </div>
      <div class="field verification-upload-field">
        <label for="su-document">Documento com foto e rosto visível</label>
        <p class="text-sm text-muted">Envie uma foto legível do RG ou documento oficial. A administradora da AURA fará a análise manual antes de liberar a conta. A imagem fica privada e será apagada após a decisão.</p>
        <input id="su-document" type="file" accept="image/jpeg,image/png,image/webp" required />
        <img id="su-document-preview" class="photo-preview hidden" alt="Prévia do documento" />
      </div>
      <label class="checkbox-row">
        <input type="checkbox" id="su-woman" required />
        <span>Declaro que sou mulher e aceito a análise manual do meu documento para liberar o acesso.</span>
      </label>
      <label class="checkbox-row">
        <input type="checkbox" id="su-terms" required />
        <span>Aceito os <a href="#" data-open="terms">termos de uso</a></span>
      </label>
      <label class="checkbox-row">
        <input type="checkbox" id="su-privacy" required />
        <span>Aceito a <a href="#" data-open="privacy">política de privacidade</a></span>
      </label>
      <button type="submit" class="btn btn-primary btn-block btn-lg" id="su-submit">Criar conta</button>
    </form>
    <div class="auth-footer">
      Já tem conta? <a href="#/entrar" data-goto="login"><strong style="color:var(--aura-600)">Entrar</strong></a>
    </div>`;
  bindAuthEvents(body);
}

function bindAuthEvents(container) {
  container.querySelectorAll(".pw-toggle").forEach(b => {
    b.addEventListener("click", () => {
      const input = document.getElementById(b.getAttribute("data-toggle"));
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      b.innerHTML = ICONS[isPass ? "eyeOff" : "eye"];
    });
  });
  container.querySelectorAll("[data-open]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); openLegalModal(a.getAttribute("data-open")); });
  });
  const gLogin = container.querySelector("[data-goto='login']");
  if (gLogin) gLogin.addEventListener("click", e => { e.preventDefault(); authRenderLogin(); });
  const gSignup = container.querySelector("[data-goto='signup']");
  if (gSignup) gSignup.addEventListener("click", e => { e.preventDefault(); authRenderSignup(); });

  const loginForm = document.getElementById("login-form");
  if (loginForm) {
    loginForm.addEventListener("submit", async e => {
      e.preventDefault();
      const email = document.getElementById("li-email").value.trim();
      const pass = document.getElementById("li-pass").value;
      const btn = document.getElementById("l-submit");
      btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Entrando...';
      try {
        await DataAccess.signIn(email, pass);
        toast("Login realizado com sucesso!", "success");
        location.hash = "/";
      } catch (err) {
        btn.disabled = false; btn.textContent = "Entrar";
        toast(friendlyAuthError(err), "error");
      }
    });
    document.getElementById("l-forgot").addEventListener("click", async e => {
      e.preventDefault();
      const email = document.getElementById("li-email").value.trim();
      if (!email) { toast("Digite seu e-mail para redefinir a senha.", "warning"); return; }
      try {
        await DataAccess.sendPasswordReset(email);
        toast("Enviamos um link de redefinição de senha para seu e-mail.", "success");
      } catch (err) {
        toast(friendlyAuthError(err), "error");
      }
    });
  }

  const signupForm = document.getElementById("signup-form");
  if (signupForm) {
    signupForm.addEventListener("submit", async e => {
      e.preventDefault();
      const name = document.getElementById("su-name").value.trim();
      const email = document.getElementById("su-email").value.trim();
      const pass = document.getElementById("su-pass").value;
      const pass2 = document.getElementById("su-pass2").value;
      const terms = document.getElementById("su-terms").checked;
      const privacy = document.getElementById("su-privacy").checked;
      const womanDeclaration = document.getElementById("su-woman").checked;
      const verificationPhoto = document.getElementById("su-document").files[0];
      const btn = document.getElementById("su-submit");

      if (name.length < 2) { toast("Informe seu nome.", "warning"); return; }
      if (pass.length < 6) { toast("A senha deve ter pelo menos 6 caracteres.", "warning"); return; }
      if (pass !== pass2) { toast("As senhas não coincidem.", "warning"); return; }
      if (!womanDeclaration) { toast("Confirme a declaração para solicitar a validação de acesso.", "warning"); return; }
      if (!terms || !privacy) { toast("Você precisa aceitar os termos e a política de privacidade.", "warning"); return; }
      if (!isFirebaseLive()) { toast("O cadastro real será liberado quando a conexão Firebase estiver configurada.", "warning"); return; }
      if (!verificationPhoto) { toast("Anexe uma foto do documento com o rosto visível.", "warning"); return; }
      if (!/^image\/(jpeg|png|webp)$/.test(verificationPhoto.type) || verificationPhoto.size > 5 * 1024 * 1024) {
        toast("Use uma imagem JPG, PNG ou WebP de até 5 MB.", "warning"); return;
      }

      btn.disabled = true; btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;border-width:2px"></div> Criando conta...';
      try {
        await DataAccess.signUp(name, email, pass, verificationPhoto);
        toast("Conta criada. Sua análise manual está pendente.", "success");
        location.hash = "/validacao";
      } catch (err) {
        btn.disabled = false; btn.textContent = "Criar conta";
        toast(err && err.code === "aura/verification-upload-failed"
          ? "A conta foi criada, mas o documento não subiu. Entre e envie novamente na tela de validação."
          : friendlyAuthError(err), "error");
      }
    });
    document.getElementById("su-document").addEventListener("change", e => {
      const file = e.target.files[0];
      const preview = document.getElementById("su-document-preview");
      if (!file) { preview.classList.add("hidden"); preview.removeAttribute("src"); return; }
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 5 * 1024 * 1024) {
        e.target.value = "";
        preview.classList.add("hidden");
        toast("Use uma imagem JPG, PNG ou WebP de até 5 MB.", "warning");
        return;
      }
      preview.src = URL.createObjectURL(file);
      preview.classList.remove("hidden");
    });
  }
}

function friendlyAuthError(err) {
  const code = err && err.code ? err.code : "";
  const map = {
    "auth/email-already-in-use": "Este e-mail já está cadastrado.",
    "auth/invalid-email": "E-mail inválido.",
    "auth/user-not-found": "Usuário não encontrado.",
    "auth/wrong-password": "Senha incorreta.",
    "auth/weak-password": "A senha é muito fraca.",
    "auth/too-many-requests": "Muitas tentativas. Aguarde alguns minutos e tente novamente."
  };
  return map[code] || (err && err.message) || "Algo deu errado. Tente novamente.";
}

function showLogin() { renderAuth(); authRenderLogin(); }
function showSignup() { renderAuth(); authRenderSignup(); }
function goAuth(mode) { renderAuth(); if (mode === "signup") authRenderSignup(); else authRenderLogin(); }
