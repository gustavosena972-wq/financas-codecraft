export type PlanId = "FREE" | "PRO" | "PLUS" | "BUSINESS" | "ENTERPRISE";
export type PlanAudience = "person" | "company" | "all";

export type Plan = {
  id: PlanId;
  name: string;
  audience: PlanAudience;
  price: string;
  priceValue: number | null;
  period: string;
  forWho: string;
  badge?: string;
  includes: string[];
  news: string[];
  cta: string;
  highlight?: boolean;
};

export const FREE_RECURRING_LIMIT = 3;
export const FREE_GOAL_LIMIT = 1;
export const PIX_PLAN_KEY = "31999758385";

export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Grátis",
    audience: "all",
    price: "R$ 0",
    priceValue: 0,
    period: "para sempre",
    forWho: "Entrar e usar. Um perfil, lançamento sem limite, chat e o mês de agora. Nada entra sem você aceitar.",
    includes: [
      "1 perfil: pessoa ou empresa",
      "Lançamentos ilimitados",
      "Chat e planilha do mês",
      "Análise do porte no espaço empresa",
      "Só muda se você gostar",
    ],
    news: [],
    cta: "Começar grátis",
  },
  {
    id: "PRO",
    name: "Pro",
    audience: "all",
    price: "R$ 27,90",
    priceValue: 27.9,
    period: "por mês",
    forWho: "Pessoa avançada e autônomo. Dois perfis juntos, exportar, foto do comprovante e chat com as contas da vida.",
    badge: "Pessoa + 2 perfis",
    includes: [
      "Tudo do Grátis",
      "2 perfis ao mesmo tempo: pessoa e empresa",
      "Exportar planilha",
      "Foto do comprovante (OCR)",
      "Chat com 50-30-20, corte, moradia, reserva e dívida",
      "Metas, teto do mês e importar extrato",
    ],
    news: [],
    cta: "Assinar Pro",
    highlight: true,
  },
  {
    id: "BUSINESS",
    name: "Business",
    audience: "company",
    price: "R$ 69,90",
    priceValue: 69.9,
    period: "por mês",
    forWho: "Empresa pequena. Tesouraria, DRE, títulos, centros, equipe e o arquivo que o contador pede.",
    badge: "Empresa",
    includes: [
      "Tudo do Pro",
      "Vários usuários na empresa",
      "Contas a pagar e a receber",
      "Centros de custo",
      "DRE, fluxo e giro",
      "Relatório Excel/CSV para o contador",
    ],
    news: [],
    cta: "Assinar Business",
  },
  {
    id: "ENTERPRISE",
    name: "Contador",
    audience: "company",
    price: "A combinar",
    priceValue: null,
    period: "por cliente ativo",
    forWho: "Escritório de contabilidade. White-label: seus clientes usam o app com a sua marca.",
    badge: "B2B",
    includes: [
      "Tudo do Business",
      "Fechar mês e conciliação",
      "Auditoria de quem fez o quê",
      "Vários CNPJs no mesmo login",
      "Combinar no WhatsApp da CodeCraft",
    ],
    news: [],
    cta: "Falar no WhatsApp",
  },
];

export function displayPlans() {
  return PLANS;
}

export function plansFor(_audience?: PlanAudience) {
  return PLANS;
}

export function personPaid(plan: PlanId | string | null | undefined) {
  return plan === "PRO" || plan === "PLUS" || plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function companyPaid(plan: PlanId | string | null | undefined) {
  return plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function workspaceToolsPaid(plan: PlanId | string | null | undefined, company: boolean) {
  return company ? companyPaid(plan) : personPaid(plan);
}

export function planHasSimulators(plan: PlanId | string | null | undefined) {
  return personPaid(plan);
}

export function planHasAi(plan: PlanId | string | null | undefined) {
  return personPaid(plan);
}

export function planHasOps(plan: PlanId | string | null | undefined) {
  return companyPaid(plan);
}

export function planHasGovernance(plan: PlanId | string | null | undefined) {
  return plan === "ENTERPRISE";
}

export function planHasClose(plan: PlanId | string | null | undefined) {
  return plan === "ENTERPRISE";
}

export function planIsPaid(plan: PlanId | string | null | undefined) {
  return personPaid(plan) || companyPaid(plan);
}

export function planForecastMonths(plan: PlanId | string | null | undefined, _company: boolean) {
  if (plan === "ENTERPRISE" || plan === "BUSINESS") return 11;
  if (plan === "PRO" || plan === "PLUS") return 6;
  return 1;
}

export function recurringLimit(plan: PlanId | string | null | undefined) {
  return personPaid(plan) ? Number.POSITIVE_INFINITY : FREE_RECURRING_LIMIT;
}

export function goalLimit(plan: PlanId | string | null | undefined) {
  return personPaid(plan) ? Number.POSITIVE_INFINITY : FREE_GOAL_LIMIT;
}

export function teamLimit(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 8;
  return 0;
}

export function planById(id: string | null | undefined, _audience?: PlanAudience): Plan {
  if (id === "PLUS") return PLANS.find((p) => p.id === "PRO") ?? PLANS[0];
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
