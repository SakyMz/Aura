// ============================================================================
// AURA - Constantes de domínio (categorias, níveis de risco, status)
// ============================================================================

const RISK_LEVELS = {
  low:      { key: "low",      label: "Baixo",   order: 0 },
  attention:{ key: "attention",label: "Atenção", order: 1 },
  moderate: { key: "moderate", label: "Moderado",order: 2 },
  high:     { key: "high",     label: "Alto",    order: 3 },
  critical: { key: "critical", label: "Crítico", order: 4 }
};

// Mapeia o "nível de atenção" do formulário (Baixo/Médio/Alto/Crítico)
// para os níveis do sistema de risco.
const FORM_RISK_TO_SYSTEM = {
  "baixo": "low",
  "atencao": "attention",
  "medio": "moderate",
  "alto": "high",
  "critico": "critical"
};

// Classes CSS para cada nível
const RISK_CLASS = {
  low: "risk-low",
  attention: "risk-attn",
  moderate: "risk-mod",
  high: "risk-high",
  critical: "risk-critical"
};

const CATEGORIES = [
  { key: "assédio",        label: "Assédio" },
  { key: "roubo",          label: "Roubo/Furto" },
  { key: "violência",      label: "Violência" },
  { key: "iluminação",     label: "Iluminação inadequada" },
  { key: "local deserto",  label: "Local deserto" },
  { key: "abordagem",      label: "Abordagem suspeita" },
  { key: "trânsito",       label: "Perigo no trânsito" },
  { key: "transporte",     label: "Transporte" },
  { key: "outro",          label: "Outro" }
];

// Formas de relato (usadas para agrupar marcadores relacionados no mapa)
const CATEGORY_ICON = {
  "assédio": "eyeOff",
  "roubo": "lock",
  "violência": "alert",
  "iluminação": "eye",
  "local deserto": "pin",
  "abordagem": "megaphone",
  "trânsito": "map",
  "transporte": "loc",
  "outro": "flag"
};

const REPORT_STATUS = {
  pending:    { key: "pending",    label: "Em análise" },
  published:  { key: "published",  label: "Publicado" },
  closed:     { key: "closed",     label: "Encerrado" },
  removed:    { key: "removed",    label: "Removido" }
};

// Mapa externo do nível do formulário -> sistema
function riskOfForm(value) {
  const k = FORM_RISK_TO_SYSTEM[(value || "").toLowerCase()];
  return k || "attention";
}

const EMERGENCY_CONTACTS = [
  { name: "Polícia Militar", number: "190" },
  { name: "Central de Atendimento à Mulher", number: "180" }
];
