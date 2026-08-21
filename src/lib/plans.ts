export type PlanId = "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";

export type Plan = {
  id: PlanId;
  name: string;
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

export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Free",
    price: "R$ 0",
    priceValue: 0,
    period: "para sempre",
    forWho: "Caixa do dia: lançar, ver saldo e organizar a planilha.",
    includes: [
      "Contas, lançamentos e visão geral",
      "Planilha do computador organizada",
      "Agenda com até 3 recorrentes",
      "1 meta de caixa",
    ],
    news: [],
    cta: "Continuar no Free",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "R$ 99",
    priceValue: 99,
    period: "por mês",
    forWho: "Operação que precisa de DRE, títulos e conciliação.",
    includes: ["Tudo do Free"],
    news: [
      "DRE do período",
      "Contas a pagar e a receber, com atraso",
      "Centros de custo e parceiros",
      "Conciliação de conta",
      "IA operacional, recorrentes e metas sem limite",
    ],
    cta: "Atualizar para Pro",
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "R$ 150",
    priceValue: 150,
    period: "por mês",
    forWho: "Empresa com pessoal separado, auditoria e até 8 assentos.",
    includes: ["Tudo do Pro"],
    news: [
      "Espaço empresa separado do pessoal",
      "Trilha de auditoria completa",
      "Até 8 pessoas na equipe",
    ],
    cta: "Atualizar para Business",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "R$ 300",
    priceValue: 300,
    period: "por mês",
    forWho: "Grupo, várias unidades e fechamento de competência.",
    includes: ["Tudo do Business"],
    news: [
      "Fechamento de mês (trava lançamento)",
      "Equipe sem limite de assento",
      "Suporte dedicado no WhatsApp",
    ],
    cta: "Atualizar para Enterprise",
    highlight: true,
  },
];

export function planHasAi(plan: PlanId | string | null | undefined) {
  return plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planHasOps(plan: PlanId | string | null | undefined) {
  return planHasAi(plan);
}

export function planHasGovernance(plan: PlanId | string | null | undefined) {
  return plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planHasClose(plan: PlanId | string | null | undefined) {
  return plan === "ENTERPRISE";
}

export function planIsPaid(plan: PlanId | string | null | undefined) {
  return planHasAi(plan);
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
  if (plan === "PRO") return 2;
  return 0;
}

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
