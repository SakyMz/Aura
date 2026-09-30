// ============================================================================
// AURA - Landing Page
// ============================================================================

function renderLanding() {
  const root = document.getElementById("landing-root");
  const demoBanner = isFirebaseLive()
    ? ""
    : '<div class="demo-banner">' + ICONS.info + 'Você está vendo dados de demonstração. Adicione suas credenciais Firebase em js/config/firebase-config.js.</div>';

  root.innerHTML = demoBanner + `
  <nav class="landing-nav">
    <span class="brand brand-full-logo">${ICONS.logo}</span>
    <div class="nav-links">
      <a href="#como-funciona">Como funciona</a>
      <a href="#beneficios">Benefícios</a>
      <a href="#mapa">Mapa</a>
      <a href="#/entrar" id="ln-login">Entrar</a>
      <a href="#/cadastro" class="btn btn-sm btn-primary nav-cta">Criar conta</a>
    </div>
  </nav>

  <header class="hero">
    <div>
      <span class="hero-eyebrow">${ICONS.shield}Segurança preventiva para mulheres</span>
      <h1>Explore sua região com <span class="grad">mais segurança</span></h1>
      <p class="sub">A AURA transforma informações da sua comunidade em inteligência para você tomar decisões mais seguras sobre deslocamentos e locais. <strong>Informação antes da situação.</strong></p>
      <div class="hero-cta">
        <a href="#/cadastro" class="btn btn-primary btn-lg">Criar conta grátis</a>
        <a href="#/mapa" class="btn btn-ghost btn-lg">Explorar mapa ${ICONS.arrowRight}</a>
      </div>
      <span class="hero-quote">${ICONS.shield} Seus dados são protegidos. Relatos são anônimos.</span>
    </div>
    <div class="hero-visual">
      <div class="float-chip fc-1"><span class="dot"></span>Região segura</div>
      <div class="float-chip fc-2"><span class="dot"></span>Alerta próximo</div>
      <div class="float-chip fc-3">${ICONS.pin} 12 relatos na área</div>
      <div class="hero-map-card">
        <div class="pulse">${ICONS.pinSolid}</div>
      </div>
    </div>
  </header>

  <section class="section" id="como-funciona">
    <div class="section-head">
      <h2>Informação antes da situação</h2>
      <p>Veja como a AURA ajuda você a circular com mais confiança, usando o poder da comunidade.</p>
    </div>
    <div class="how-grid">
      <div class="card how-card">
        <div class="how-num">1</div>
        <h3>Visualize o mapa de risco</h3>
        <p>Consulte regiões com relatos de outras mulheres e entenda o nível de atenção de cada área antes de decidir seu caminho.</p>
      </div>
      <div class="card how-card">
        <div class="how-num">2</div>
        <h3>Relate situações</h3>
        <p>Compartilhe de forma anônima o que você presenciou. Cada relato ajuda outras pessoas a se protegerem.</p>
      </div>
      <div class="card how-card">
        <div class="how-num">3</div>
        <h3>Receba alertas próximos</h3>
        <p>Fique por dentro dos avisos e relatos recentes da sua região e planeje seus deslocamentos com mais segurança.</p>
      </div>
    </div>
  </section>

  <section class="section section-alt" id="beneficios">
    <div class="section-head">
      <h2>Feito para você decidir com segurança</h2>
      <p>Uma plataforma acolhedora, tecnológica e simples de usar.</p>
    </div>
    <div class="benefit-grid">
      <div class="card benefit-card">
        <div class="b-ico">${ICONS.map}</div>
        <h3>Mapa inteligente</h3>
        <p>Visualize níveis de atenção por região, com relatos e categoria em um só lugar.</p>
      </div>
      <div class="card benefit-card">
        <div class="b-ico">${ICONS.shield}</div>
        <h3>Anonimato real</h3>
        <p>Nunca expomos quem fez o relato nem sua localização pessoal. Sua privacidade em primeiro lugar.</p>
      </div>
      <div class="card benefit-card">
        <div class="b-ico">${ICONS.users}</div>
        <h3>Comunidade conectada</h3>
        <p>Informações de mulheres para mulheres, transformando experiência em prevenção.</p>
      </div>
      <div class="card benefit-card">
        <div class="b-ico">${ICONS.bell}</div>
        <h3>Alertas próximos</h3>
        <p>Receba avisos quando novas situações forem relatadas na sua região.</p>
      </div>
      <div class="card benefit-card">
        <div class="b-ico">${ICONS.heart}</div>
        <h3>Acolhimento</h3>
        <p>Ambiente acolhedor e simples, feito para que você se sinta segura ao usar.</p>
      </div>
      <div class="card benefit-card">
        <div class="b-ico">${ICONS.flag}</div>
        <h3>Relatos organizados</h3>
        <p>Acompanhe o andamento dos seus relatos e contribua para uma cidade mais segura.</p>
      </div>
    </div>
  </section>

  <section class="section" id="mapa">
    <div class="section-head">
      <h2>Níveis de atenção por região</h2>
      <p>Entenda a classificação usada para indicar onde ter mais atenção.</p>
    </div>
    <div class="risk-legend">
      <span class="rl"><span class="dot" style="background:var(--risk-low)"></span>Baixo</span>
      <span class="rl"><span class="dot" style="background:#eab308"></span>Atenção</span>
      <span class="rl"><span class="dot" style="background:var(--risk-mod)"></span>Moderado</span>
      <span class="rl"><span class="dot" style="background:var(--risk-high)"></span>Alto</span>
      <span class="rl"><span class="dot" style="background:var(--risk-critical)"></span>Crítico</span>
    </div>
    <div class="center">
      <a href="#/mapa" class="btn btn-primary btn-lg">Explorar mapa ${ICONS.arrowRight}</a>
    </div>
  </section>

  <section class="section section-alt">
    <div class="app-cta">
      <div class="glow" style="top:-80px; right:-60px"></div>
      <div class="glow" style="bottom:-100px; left:-40px; background:rgba(170,92,221,.2)"></div>
      <div>
        <h2>Junte-se à comunidade AURA</h2>
        <p>Relatar uma situação agora mesmo ou explore sua região para decidir com mais segurança.</p>
        <div class="btn-row">
          <a href="#/cadastro" class="btn btn-cta btn-lg">Criar conta</a>
          <a href="#/relatar" class="btn btn-lg" style="background:rgba(255,255,255,.16);color:#fff;border:1.5px solid rgba(255,255,255,.5)">Relatar uma situação</a>
        </div>
      </div>
    </div>
  </section>

  <footer class="landing-footer">
    <div>
      <span class="brand brand-full-logo">${ICONS.logo}</span>
      <p>Transformamos informação da comunidade em inteligência para decisões mais seguras. Informação antes da situação.</p>
    </div>
    <div>
      <h4>Plataforma</h4>
      <a href="#/mapa">Explorar mapa</a>
      <a href="#/relatar">Relatar situação</a>
      <a href="#/cadastro">Criar conta</a>
    </div>
    <div>
      <h4>Legal</h4>
      <a href="#" data-open="terms">Termos de uso</a>
      <a href="#" data-open="privacy">Política de privacidade</a>
    </div>
    <div class="footer-note">© ${new Date().getFullYear()} AURA. Feito com cuidado para a segurança das mulheres.</div>
  </footer>`;

  root.querySelectorAll("a[data-open]").forEach(a => {
    a.addEventListener("click", e => { e.preventDefault(); openLegalModal(a.getAttribute("data-open")); });
  });
}

function openLegalModal(which) {
  const c = LEGAL_CONTENT[which] || LEGAL_CONTENT.terms;
  openModal(
    '<div class="modal-head"><h3>' + esc(c.title) + '</h3><button class="x" onclick="closeModal()">&times;</button></div>' +
    '<div class="modal-body"><div class="text-sm" style="color:var(--gray-700);line-height:1.7;white-space:pre-line">' +
    esc(c.body) + '</div></div>'
  );
}

const LEGAL_CONTENT = {
  terms: {
    title: "Termos de uso",
    body:
`Ao utilizar a AURA você concorda com as seguintes condições.

1. A AURA é uma plataforma de informação comunitária e não substitui serviços de emergência (como polícia ou SAMU).

2. Os relatos compartilhados são anônimos por padrão. Não publicamos a identidade de quem relata.

3. As informações exibidas são fornecidas pela comunidade e podem conter imprecisões. Avalie sempre seus deslocamentos com bom senso.

4. É proibida a utilização da plataforma para discriminação, difamação ou conteúdo falso e prejudicial.

5. Você é responsável pela veracidade das informações que enviar.

6. Em caso de emergência, ligue para os números oficiais de segurança da sua cidade.`
  },
  privacy: {
    title: "Política de privacidade",
    body:
`A AURA leva a sua privacidade a sério.

1. Coletamos seu nome e e-mail para criar sua conta.

2. Utilizamos sua localização apenas para centralizar o mapa, buscar alertas próximos e registrar o local dos relatos.

3. Nunca expomos sua localização pessoal nem seu userId para outras usuárias.

4. Quando você faz um relato, a localização informada é apenas a do local do ocorrido, e não a sua posição pessoal.

5. Suas informações não são vendidas a terceiros.

6. Para validar o acesso, solicitamos uma foto legível de documento oficial com foto e rosto. A análise é manual e feita apenas pela administradora; a imagem fica em armazenamento privado e é apagada após a decisão.

7. O documento é usado somente para a validação da conta. Não fazemos reconhecimento facial automatizado.

8. Você pode solicitar a exclusão dos seus dados a qualquer momento entrando em contato conosco.`
  }
};
