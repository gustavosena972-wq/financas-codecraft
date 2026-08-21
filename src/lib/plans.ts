export type PlanId = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
export type PlanAudience = "person" | "company";

export type Plan = {
  id: PlanId;
  name: string;
  audience: PlanAudience;
  price: string;
  priceValue: number | null;
  period: string;
  forWho: string;
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
    forWho: "Só para pessoa. Coloca os gastos e vê o caixa.",
    includes: [
      "Gastos, contas e visão geral",
      "Planilha do computador",
      "Até 3 contas que se repetem",
      "1 meta",
    ],
    news: [],
    cta: "Continuar grátis",
  },
  {
    id: "PRO",
    name: "Pessoal",
    audience: "person",
    price: "R$ 29",
    priceValue: 29,
    period: "por mês",
    forWho: "Só para pessoa. IA do mês e teto sem limite.",
    includes: ["Tudo do Grátis"],
    news: [
      "IA mostra o que cortar",
      "Contas do mês e metas sem limite",
      "Teto do mês sem trava",
    ],
    cta: "Assinar Pessoal",
    highlight: true,
  },
  {
    id: "BUSINESS",
    name: "Empresa",
    audience: "company",
    price: "R$ 199",
    priceValue: 199,
    period: "por mês",
    forWho: "Só para empresa. Títulos, DRE e conciliação.",
    includes: [
      "Espaço Empresa separado do pessoal",
      "Contas a pagar e a receber",
      "DRE, fluxo e conciliação",
      "Centros, parceiros e auditoria",
      "Até 8 pessoas na equipe",
    ],
    news: [],
    cta: "Assinar Empresa",
  },
  {
    id: "ENTERPRISE",
    name: "Empresa Plus",
    audience: "company",
    price: "R$ 399",
    priceValue: 399,
    period: "por mês",
    forWho: "Só para empresa grande. Fecha o mês e equipe sem teto.",
    includes: ["Tudo do plano Empresa"],
    news: [
      "Fechamento de mês (trava lançamento)",
      "Equipe sem limite",
      "WhatsApp dedicado",
    ],
    cta: "Assinar Empresa Plus",
  },
];

export function plansFor(audience: PlanAudience) {
  return PLANS.filter((p) => p.audience === audience);
}

export function planHasAi(plan: PlanId | string | null | undefined) {
  return plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";
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
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
