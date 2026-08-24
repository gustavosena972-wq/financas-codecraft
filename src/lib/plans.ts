import type { PlanId } from "./types";

export type Plan = {
  id: PlanId;
  name: string;
  price: string;
  value: number;
  period: string;
  forWho: string;
  badge?: string;
  highlight?: boolean;
  includes: string[];
  cta: string;
};

export const PIX_KEY = "31999758385";

export const PLANS: Plan[] = [
  {
    id: "FREE",
    name: "Começar",
    price: "R$ 0",
    value: 0,
    period: "para entrar",
    forWho: "Ver a empresa inteira. A IA observa. Você decide o que ela pode fechar sozinha.",
    includes: [
      "Painel com todos os setores",
      "2 pessoas",
      "IA: 8 ações por dia",
      "Dinheiro não mexe sozinho",
    ],
    cta: "Começar grátis",
  },
  {
    id: "TEAM",
    name: "Time",
    price: "R$ 197",
    value: 197,
    period: "por mês",
    forWho: "Equipe pequena que precisa de gente, venda e projeto no mesmo lugar.",
    includes: [
      "Tudo do Começar",
      "8 pessoas",
      "Vendas e projetos",
      "IA: 40 ações por dia",
    ],
    cta: "Assinar Time",
  },
  {
    id: "BUSINESS",
    name: "Empresa",
    price: "R$ 305",
    value: 305,
    period: "por mês",
    forWho: "A empresa rodando: pessoas, caixa, estoque e IA em 95% do trabalho.",
    badge: "Mais usado",
    highlight: true,
    includes: [
      "Todos os setores",
      "IA autônoma 95%",
      "12 pessoas",
      "Caixa, títulos e estoque",
      "120 ações de IA por dia",
    ],
    cta: "Assinar Empresa",
  },
  {
    id: "ENTERPRISE",
    name: "Completo",
    price: "R$ 400",
    value: 400,
    period: "por mês",
    forWho: "Sem teto. A IA trabalha o dia todo. Você só entra no 5% que mexe dinheiro ou gente.",
    badge: "Tudo",
    includes: [
      "Tudo da Empresa",
      "Pessoas sem limite",
      "IA sem teto no dia",
      "Trilha de auditoria da IA",
    ],
    cta: "Assinar Completo",
  },
];

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[0];
}

export function peopleLimit(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 12;
  if (plan === "TEAM") return 8;
  return 2;
}

export function aiLimit(plan: PlanId | string | null | undefined) {
  if (plan === "ENTERPRISE") return Number.POSITIVE_INFINITY;
  if (plan === "BUSINESS") return 120;
  if (plan === "TEAM") return 40;
  return 8;
}

export function hasCash(plan: PlanId | string | null | undefined) {
  return plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function hasOps(plan: PlanId | string | null | undefined) {
  return plan === "TEAM" || plan === "BUSINESS" || plan === "ENTERPRISE";
}

export function planLabel(plan: PlanId | string | null | undefined) {
  return planById(plan).name;
}
