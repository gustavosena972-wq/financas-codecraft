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
    name: "Experimentar",
    audience: "all",
    price: "R$ 0",
    priceValue: 0,
    period: "para entrar",
    forWho: "Ver a casa e a empresa no mesmo login. A planilha entra. A IA lê. Nada muda sem você aceitar.",
    includes: [
      "Pessoa e empresa, espaços separados",
      "Mandar o Excel da casa",
      "Ver o que vai gastar e o que sobra neste mês",
      "IA: 8 perguntas por dia",
      "Só muda se você gostar",
    ],
    news: [],
    cta: "Começar grátis",
  },
  {
    id: "PRO",
    name: "Casa",
    audience: "person",
    price: "R$ 107",
    priceValue: 107,
    period: "por mês, renovação automática",
    forWho: "A família. O app diz o que ainda sai, o que sobra no ano, e o que cortar no cartão — todo dia.",
    badge: "Mais usado",
    includes: [
      "Tudo do Experimentar",
      "Ano inteiro: vai gastar / vai sobrar",
      "Cartões mês a mês e meta de baixar a fatura",
      "IA avalia o plano todo dia · 40 perguntas",
      "Sem parcela nova enquanto as atuais não acabam",
    ],
    news: [],
    cta: "Assinar Casa",
    highlight: true,
  },
  {
    id: "PLUS",
    name: "Casa Plus",
    audience: "person",
    price: "R$ 200",
    priceValue: 200,
    period: "por mês, renovação automática",
    forWho: "Quem já usa a casa e quer exportar, foto da nota e as contas extras.",
    includes: [
      "Tudo da Casa",
      "IA: 80 perguntas por dia",
      "Exportar planilha",
      "Foto do comprovante",
      "Metas e simulador de dívida",
    ],
    news: [],
    cta: "Assinar Casa Plus",
  },
  {
    id: "BUSINESS",
    name: "Empresa",
    audience: "company",
    price: "R$ 305",
    priceValue: 305,
    period: "por mês, renovação automática",
    forWho: "MEI ao PME. Caixa, títulos, DRE e fluxo — o que o QuickBooks faz, em português, sem misturar com a casa.",
    badge: "Empresa",
    includes: [
      "Tudo da Casa Plus no espaço pessoa",
      "IA: 120 perguntas por dia na tesouraria",
      "A pagar e a receber",
      "DRE e fluxo de caixa",
      "Equipe (até 8 pessoas)",
      "Relatório para o contador",
    ],
    news: [],
    cta: "Assinar Empresa",
  },
  {
    id: "ENTERPRISE",
    name: "Completo",
    audience: "all",
    price: "R$ 400",
    priceValue: 400,
    period: "por mês, renovação automática",
    forWho: "Casa + empresa no mesmo login, com fechamento de mês. O pacote que escritório de fora reconhece.",
    badge: "Tudo",
    includes: [
      "Tudo da Empresa",
      "IA sem teto de perguntas no dia",
      "Conciliação com o extrato",
      "Auditoria de quem fez o quê",
      "Fechar o mês",
      "Equipe sem limite",
    ],
    news: [],
    cta: "Assinar Completo",
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
  if (company) return companyPaid(plan);
  return plan === "PLUS" || plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planHasSimulators(plan: PlanId | string | null | undefined) {
  return plan === "PLUS" || plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planHasAi(_plan?: PlanId | string | null) {
  return true;
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
  if (planIsPaid(plan)) return 11;
  return 1;
}

export function recurringLimit(plan: PlanId | string | null | undefined) {
  return personPaid(plan) ? Number.POSITIVE_INFINITY : FREE_RECURRING_LIMIT;
}

export function goalLimit(plan: PlanId | string | null | undefined) {
  return personPaid(plan) ? Number.POSITIVE_INFINITY : FREE_GOAL_LIMIT;
}

export function planChatAsksPerDay(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 120;
  if (plan === "PLUS") return 80;
  if (plan === "PRO") return 40;
  return 8;
}

export function planChatChars(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return 4000;
  if (plan === "BUSINESS") return 2500;
  if (plan === "PLUS") return 1800;
  if (plan === "PRO") return 1200;
  return 400;
}

export function planChatAskLabel(plan: PlanId | string | null | undefined) {
  const limit = planChatAsksPerDay(plan);
  return Number.isFinite(limit) ? `${limit} perguntas por dia` : "perguntas ilimitadas no dia";
}

export function teamLimit(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 8;
  return 0;
}

export function planById(id: string | null | undefined, _audience?: PlanAudience): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function planLabel(plan: PlanId | string | null | undefined) {
  return planById(plan).name;
}

export function planPriceLine() {
  return "Experimentar grátis. Casa R$ 107, Casa Plus R$ 200, Empresa R$ 305, Completo R$ 400 — por mês, renovação automática.";
}
