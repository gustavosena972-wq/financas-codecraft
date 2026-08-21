export type PlanId = "FREE" | "PRO" | "PLUS" | "BUSINESS" | "ENTERPRISE";
export type PlanAudience = "person" | "company";

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
    audience: "person",
    price: "R$ 0",
    priceValue: 0,
    period: "para sempre",
    forWho: "Chat, planilha e o mês de agora. Nada entra no controle sem você aceitar.",
    includes: [
      "Chat para estruturar a planilha",
      "Abre o Excel do computador e sugere",
      "Só muda se você gostar",
      "Se não tiver planilha, ele monta uma",
      "Previsão deste mês",
    ],
    news: [],
    cta: "Começar grátis",
  },
  {
    id: "PRO",
    name: "Pessoa 100",
    audience: "person",
    price: "R$ 100",
    priceValue: 100,
    period: "por mês",
    forWho: "O chat ganha as ferramentas da pessoa: corte, 50-30-20, moradia e dívida.",
    includes: [
      "Tudo do Grátis",
      "Planilha completa: 50-30-20, reserva, contas e fórmulas",
      "Previsão dos próximos 6 meses",
      "50-30-20, corte e teto de moradia",
      "Simulador de dívida",
      "Metas e contas do mês sem limite",
    ],
    news: [],
    cta: "Assinar Pessoa 100",
    highlight: true,
  },
  {
    id: "PLUS",
    name: "Pessoa 200",
    audience: "person",
    price: "R$ 200",
    priceValue: 200,
    period: "por mês",
    forWho: "O pacote cheio da pessoa. Ano inteiro no chat e IA na categoria.",
    includes: [
      "Tudo do Pessoa 100",
      "Planilha cheia: metas e previsão do ano com fórmula",
      "Previsão do ano todo",
      "IA sugere categoria",
      "Reserva e o que cortar com mais detalhe",
    ],
    news: [],
    cta: "Assinar Pessoa 200",
  },
  {
    id: "FREE",
    name: "Grátis",
    audience: "company",
    price: "R$ 0",
    priceValue: 0,
    period: "para sempre",
    forWho: "Chat do caixa. Autônomo, MEI ou empresa. Planilha só entra se você aceitar.",
    includes: [
      "Análise do porte: autônomo, MEI, pequena ou grande",
      "Abre o arquivo e sugere, sem mudar sozinho",
      "Monta planilha e orçamento mês a mês",
      "Gráfico do dinheiro livre no próximo mês",
    ],
    news: [],
    cta: "Começar grátis",
  },
  {
    id: "BUSINESS",
    name: "Empresa 100",
    audience: "company",
    price: "R$ 100",
    priceValue: 100,
    period: "por mês",
    forWho: "Tesouraria no chat: giro, preço, títulos e DRE. Serve da PJ pequena para cima.",
    includes: [
      "Tudo do Grátis da empresa",
      "Planilha de tesouraria: DRE, fluxo, títulos, giro e indicadores",
      "Previsão dos próximos 6 meses",
      "Giro: não gaste o que ainda não caiu",
      "Precificar serviço com imposto e margem",
      "Títulos e DRE no chat",
    ],
    news: [],
    cta: "Assinar Empresa 100",
    highlight: true,
  },
  {
    id: "ENTERPRISE",
    name: "Empresa 200",
    audience: "company",
    price: "R$ 200",
    priceValue: 200,
    period: "por mês",
    forWho: "O pacote cheio: fechamento, equipe, conciliação. Empresa grande de verdade.",
    includes: [
      "Tudo do Empresa 100",
      "Planilha cheia: fechamento, equipe, conciliação e ano",
      "Previsão do ano todo",
      "Fechamento de mês",
      "Equipe e auditoria",
      "Conciliação com o banco",
    ],
    news: [],
    cta: "Assinar Empresa 200",
  },
];

export function displayPlans() {
  return PLANS;
}

export function plansFor(audience: PlanAudience) {
  return PLANS.filter((p) => p.audience === audience);
}

export function personPaid(plan: PlanId | string | null | undefined) {
  return plan === "PRO" || plan === "PLUS";
}

export function companyPaid(plan: PlanId | string | null | undefined) {
  return plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function workspaceToolsPaid(plan: PlanId | string | null | undefined, company: boolean) {
  return company ? companyPaid(plan) : personPaid(plan);
}

export function planHasSimulators(plan: PlanId | string | null | undefined) {
  return personPaid(plan) || companyPaid(plan);
}

export function planHasAi(plan: PlanId | string | null | undefined) {
  return plan === "PLUS" || plan === "ENTERPRISE" || plan === "PRO" || plan === "BUSINESS";
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

export function planForecastMonths(plan: PlanId | string | null | undefined, company: boolean) {
  if (company) {
    if (plan === "ENTERPRISE") return 11;
    if (plan === "BUSINESS") return 6;
    return 1;
  }
  if (plan === "PLUS") return 11;
  if (plan === "PRO") return 6;
  return 1;
}

export function recurringLimit(plan: PlanId | string | null | undefined) {
  return personPaid(plan) || companyPaid(plan) ? Number.POSITIVE_INFINITY : FREE_RECURRING_LIMIT;
}

export function goalLimit(plan: PlanId | string | null | undefined) {
  return personPaid(plan) ? Number.POSITIVE_INFINITY : FREE_GOAL_LIMIT;
}

export function teamLimit(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 8;
  return 0;
}

export function planById(id: string | null | undefined, audience?: PlanAudience): Plan {
  if (audience) {
    const match = PLANS.find((p) => p.id === id && p.audience === audience);
    if (match) return match;
    return PLANS.find((p) => p.id === "FREE" && p.audience === audience) ?? PLANS[0];
  }
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
