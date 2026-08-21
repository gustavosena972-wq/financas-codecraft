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
    forWho: "Organizar o caixa e a planilha que você já usa.",
    includes: [
      "Contas, lançamentos e dashboard",
      "Pegar a planilha do computador, organizar e baixar clara",
      "Agenda do que vence no mês",
      "Até 3 contas recorrentes",
      "1 meta",
    ],
    news: [],
    cta: "Continuar no Free",
  },
  {
    id: "PRO",
    name: "Pro",
    price: "R$ 29,90",
    priceValue: 29.9,
    period: "por mês",
    forWho: "Quem já lança e quer o app pensando o mês à frente.",
    includes: ["Tudo do Free"],
    news: [
      "IA operacional: explica o mês e alerta desvio",
      "Recorrentes e metas sem limite",
      "Sugestão de categoria ao lançar e importar",
      "Importar, exportar, orçamento e fluxo projetado",
    ],
    cta: "Atualizar para Pro",
    highlight: true,
  },
  {
    id: "BUSINESS",
    name: "Business",
    price: "R$ 79,90",
    priceValue: 79.9,
    period: "por mês",
    forWho: "Quem precisa separar a vida pessoal da empresa.",
    includes: ["Tudo do Pro, inclusive a IA"],
    news: [
      "Espaço empresa separado do pessoal",
      "Auditoria das ações",
      "Dois perfis no mesmo login",
    ],
    cta: "Atualizar para Business",
  },
  {
    id: "ENTERPRISE",
    name: "Enterprise",
    price: "A partir de R$ 199",
    priceValue: null,
    period: "combinado com a operação",
    forWho: "Operação maior, com gente e integração.",
    includes: ["Tudo do Business"],
    news: ["Vários usuários", "Integrações", "Suporte dedicado"],
    cta: "Falar sobre Enterprise",
  },
];

export function planHasAi(plan: PlanId | string | null | undefined) {
  return plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";
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

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}
