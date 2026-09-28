# AURA

Plataforma web responsiva de **segurança preventiva para mulheres**.

**Conceito:** transformar informação da comunidade em inteligência para decisões mais seguras.
**Posicionamento:** segurança preventiva. **Ideia central:** *"Informação antes da situação."*

## Como executar

Este é um aplicativo web 100% estático (HTML/CSS/JS). Não exige build.

1. Abra o arquivo `index.html` em qualquer navegador **OU** sirva a pasta com um servidor estático:
   ```
   python -m http.server 8080
   # depois acesse http://localhost:8080
   ```
2. Sem credenciais configuradas, o app roda em **MODO DEMONSTRAÇÃO** — os dados são claramente identificados como de demonstração (banner roxo no topo e dados mockados). Toda a interface, navegação e fluxos funcionam normalmente.

## Configurando o Firebase (produção)

1. Crie um projeto em https://console.firebase.google.com
2. Em **Authentication** → Sign-in method, habilite **E-mail/Senha**.
3. Em **Firestore Database**, crie o banco.
4. Em **Storage**, crie o bucket.
5. Em **Configurações do projeto** → **Seus apps** → **App Web**, copie o objeto `firebaseConfig`.
6. Cole o objeto em `js/config/firebase-config.js` (campos `apiKey`, `authDomain`, etc.).
7. Aplique as regras de segurança:
   - Firestore: conteúdo de `backend/rules/firestore.rules`
   - Storage: conteúdo de `backend/storage/storage.rules`

**Google Maps (opcional):**
- Obtenha uma chave API com a API *Maps JavaScript* habilitada em https://console.cloud.google.com
- Cole em `window.AURA_GOOGLE_MAPS_KEY` em `js/config/firebase-config.js`.
- Sem chave, o app usa um mapa de demonstração (Leaflet/OpenStreetMap). Nenhuma chave adicional é necessária.

## Estrutura do banco (Firestore)

### `users`
```
id, name, email, profileImage, createdAt, updatedAt
```
- **role**: para tornar uma usuária administradora, adicione o campo `role: "admin"` ao documento dela (manual no console) e aplique as regras `backend/rules/firestore.rules`.

### `reports`
```
id, userId, category, description, latitude, longitude,
riskLevel, date, createdAt, imageUrl, status, anonymous
```
- `status`: `pending` (em análise) | `published` | `closed` | `removed`
- `riskLevel`: `low` | `attention` | `moderate` | `high` | `critical`
- `anonymous`: relatos são anônimos por padrão

### `alerts`
```
id, title, description, latitude, longitude, riskLevel, createdAt, status
```

### `live_shares` (localização ao vivo)
```
id (token), userId, trustedName, durationMin,
status, createdAt, expiresAt, updatedAt, lat, lng
```
- `status`: `active` | `stopped` | `expired`
- Leitura **pública por token** (quem tem o link acompanha sem login).
- A dona atualiza a posição a cada ~5s; o link expira automaticamente em `expiresAt`.
- No modo demo, os dados ficam em `localStorage` (`aura_live_shares`) e o tempo real
  entre abas usa `BroadcastChannel("aura_live")` + polling de 3s.

## Compartilhamento de localização ao vivo
- **Onde acessar:** Início (card "Pessoa de confiança"), Mapa (botão AO VIVO), ou
  Perfil → "Pessoa de confiança".
- **Como funciona:** informe o nome da pessoa e a duração → o AURA gera um link
  (`#/share/TOKEN`). Envie por WhatsApp/copiar. A pessoa abre o link e acompanha
  sua posição em um mapa em tempo real, sem precisar de conta.
- **Privacidade:** sem o token ninguém vê o mapa; o link pode ser encerrado pela
  dona a qualquer momento e expira sozinho ao fim da duração escolhida.

## Validação de acesso (exclusivo para mulheres)
Para manter a comunidade segura, o AURA libera o app apenas para mulheres
validadas. O fluxo acontece **após o login/cadastro**, na tela `#/validacao`:

1. Nome completo (nome e sobrenome).
2. CPF com verificação do dígito verificador (algoritmo Módulo 11, no cliente).
3. Autodeclaração: "Declaro que me identifico como mulher...".

O **CPF completo nunca é armazenado**: guardamos apenas a versão mascarada
(`***.***.**9-99`) e um hash (`cpfHash`) para evitar duplicidade. Enquanto a
conta não for validada, o `router` bloqueia todas as rotas do app.

No Firebase, o documento da usuária recebe: `gender: "female"`, `verified: true`,
`documentType: "cpf"`, `cpfMasked`, `cpfHash`, `validatedAt`. As regras do
Firestore exigem `verified == true` **e** `gender == "female"` para criar relatos
e compartilhamentos ao vivo (`isVerifiedWoman()`).

> Observação: a checagem do CPF é feita no cliente (dígito verificador).
> Para produção, recomenda-se também validar nome × CPF em um serviço confiável
> (ex.: consulta a bureau/Receita) e verificação de e-mail.

## Mapa (OpenStreetMap)
A integração oficial do mapa é o **OpenStreetMap**, renderizado com **Leaflet**
(veja `js/services/map.js`). Não é necessária chave de API.
- Tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- A atribuição ao OpenStreetMap é mantida no mapa, conforme exigido.

### Mapa de segurança colaborativo
O mapa transforma relatos da comunidade em **áreas de alerta visual**:
- **Marcadores** de cada relato, com popup exibindo tipo, data/horário,
  nível de alerta e descrição resumida (sem dados pessoais).
- **RELATOS → CONCENTRAÇÃO → ÁREA DE ALERTA**: cada relato gera uma zona de
  influência; quanto mais relatos próximos, maior/mais intensa a área.
  Níveis: Área segura (0) · Atenção (1–2) · Alerta (3–5) · Alerta elevado (6+),
  definidos em `ALERT_ZONE_LEVELS` (`js/constants.js`).
- **Heatmap** (`Leaflet.heat`) somado a círculos de influência semitransparentes,
  renderizado em `AuraMap.renderConcentration()`.
- **Painel lateral** (bottom sheet no celular): legenda, nota colaborativa
  ("área com concentração de relatos", nunca "área perigosa"), botão
  **Encontrar rota** e lista de **relatos recentes** com distância aproximada.
- **Filtros** por categoria (Todos/Assédio/Perseguição/Roubo/Violência/Abordagem/
  Infraestrutura), recalcularam marcadores e áreas na hora (`js/pages/map-page.js`).
- **+ Relatar ocorrência**: modal rápido com categoria, nível de gravidade,
  ponto marcado diretamente no mapa e descrição. Após enviar, o mapa recalcula
  imediatamente as áreas e a lista.
- **Dados fictícios**: em modo demo, `baseDemoReports()` (`js/services/data.js`)
  fornece ~23 relatos agrupados para demonstrar as zonas; novos relatos da
  sessão aparecem somados aos fictícios.

### Rotas seguras (estrutura preparada)
O botão **Encontrar rota** desenha uma rota simulada (linha destacada) entre a
localização da usuária e um destino escolhido no mapa. A arquitetura em
`js/services/routing.js` (`planSafeRoute`/`routeGeometry`) está pronta para
integrar uma API real de rotas (ex.: OSRM/Mapbox Directions) sem mudar a
interface das telas.

## Ajuda e emergência (após o login)
Disponível sempre depois de logar, por três caminhos: botão flutuante vermelho
**Ajuda**, ícone no topo (topbar) e botão na barra de ferramentas do mapa — além
de Perfil → "Ajuda e emergência". O modal oferece ligação direta para:
- **190 — Polícia Militar**
- **180 — Central de Atendimento à Mulher**
- Atalho para "Compartilhar minha localização ao vivo".

Os contatos ficam em `EMERGENCY_CONTACTS` (`js/constants.js`), fáceis de ajustar.

## Camadas do projeto

```
index.html                            Página única (SPA)
css/
  aura.css    Design system (tema roxo/lilás, botões, cards, risco, toast, modal)
  layout.css  Shell (sidebar, topbar, bottom-nav, marcadores)
  pages.css   Estilos das páginas
js/
  config/firebase-config.js            CREDENCIAIS (preencher)
  constants.js                         Categorias, níveis, status
  icons.js                             Iconografia SVG
  utils.js                             Datas, distância, sanitização
  services/
    data.js                            DataAccess (Firebase/Demo)
    map.js                             OpenStreetMap via Leaflet
  components/
    feedback.js                        Toast + Modal
    report-components.js               Cards e modal de detalhe de relato
    emergency.js                       Botão de ajuda + contatos 190/180
  pages/
    landing.js  auth.js  verify.js  home.js  map-page.js  report.js
    my-reports.js  profile.js  notifications.js  trusted-share.js  admin.js
  router.js                            Navegação + shell
  app.js                               Bootstrap
backend/
  rules/firestore.rules                Segurança do Firestore
  storage/storage.rules                Segurança do Storage
```

## Segurança e privacidade

- Autenticação via Firebase (usuário comum e admin, diferenciados pelo campo `role`).
- **Acesso exclusivo para mulheres validadas** (nome completo + CPF + autodeclaração).
- O CPF completo não é armazenado — apenas versão mascarada e hash.
- Regras do Firestore impedem que um usuário comum altere/exclua relatos de outros.
- Relatos são anônimos por padrão; o `userId` nunca é exibido publicamente.
- A localização informada em um relato é a do **local do ocorrido**, nunca a posição pessoal da usuária.
- As regras exigem validação dos dados enviados (status fixado em `pending` na criação).

## Inteligência de risco (arquitetura preparada)

O sistema está pronto para evoluir para um **índice de atenção da região** baseado em concentração, frequência, recência, categoria, gravidade, horário, reincidência e distância da usuária. A estrutura de notas/index fica em `js/constants.js` e é facilmente ajustável.

Futuro: 0–25 Baixo · 26–50 Atenção · 51–75 Moderado · 76–100 Alto.
