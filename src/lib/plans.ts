export type PlanId = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type PlanAudience = "person" | "company" | "both";

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

const FREE_PLAN: Plan = {
  id: "FREE",
  name: "Grátis",
  audience: "person",
  price: "R$ 0",
  priceValue: 0,
  period: "para sempre",
  forWho: "Antes de assinar.",
  includes: [],
  news: [],
  cta: "Continuar grátis",
};

export const PLANS: Plan[] = [
  {
    id: "PRO",
    name: "Pessoal",
    audience: "person",
    price: "R$ 19",
    priceValue: 19,
    period: "por mês",
    forWho: "Sua vida financeira inteira por menos de um almoço.",
    includes: [
      "Chat do contador, planilha e o ano todo",
      "O que cortar e o próximo trimestre",
      "Simulador de corte, 50-30-20, moradia e dívida",
      "Teto, metas e contas do mês sem limite",
      "IA sugere categoria",
    ],
    news: [],
    cta: "Quero o Pessoal",
  },
  {
    id: "BUSINESS",
    name: "Empresa",
    audience: "company",
    price: "R$ 49",
    priceValue: 49,
    period: "por mês",
    forWho: "Tesouraria de empresa pequena. Preço de ferramenta, não de ERP.",
    includes: [
      "Tudo do Pessoal, no espaço da empresa",
      "Chat do caixa, títulos, DRE e giro",
      "Pagar, receber e conciliar com o banco",
      "Precificar serviço com imposto e margem",
      "Até 8 pessoas na equipe",
    ],
    news: [],
    cta: "Quero o Empresa",
  },
  {
    id: "ENTERPRISE",
    name: "Completo",
    audience: "both",
    price: "R$ 59",
    priceValue: 59,
    period: "por mês",
    forWho: "Pessoa e empresa no mesmo login. Sai mais barato que assinar os dois.",
    badge: "Vale mais a pena",
    includes: [
      "Tudo do Pessoal + tudo do Empresa",
      "Os dois espaços, sem misturar o dinheiro",
      "Fechamento de mês e equipe sem teto",
      "Economiza R$ 9 todo mês frente aos dois juntos",
    ],
    news: [],
    cta: "Quero o Completo",
    highlight: true,
  },
];

export function displayPlans() {
  return PLANS;
}

export function plansFor(_audience: PlanAudience) {
  return PLANS;
}

export function planHasSimulators(plan: PlanId | string | null | undefined) {
  return planIsPaid(plan);
}

export function planHasAi(plan: PlanId | string | null | undefined) {
  return planIsPaid(plan);
}

export function planHasOps(plan: PlanId | string | null | undefined) {
  return plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planHasGovernance(plan: PlanId | string | null | undefined) {
  return plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planHasClose(plan: PlanId | string | null | undefined) {
  return plan === "ENTERPRISE";
}

export function planIsPaid(plan: PlanId | string | null | undefined) {
  return plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function recurringLimit(plan: PlanId | string | null | undefined) {
  return planIsPaid(plan) ? Number.POSITIVE_INFINITY : FREE_RECURRING_LIMIT;
}

export function goalLimit(plan: PlanId | string | null | undefined) {
  return planIsPaid(plan) ? Number.POSITIVE_INFINITY : FREE_GOAL_LIMIT;
}

export function teamLimit(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 8;
  return 0;
}

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? FREE_PLAN;
}
