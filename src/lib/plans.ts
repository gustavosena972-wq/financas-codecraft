import type { PlanId, Profile } from "./types";

export const PIX_KEY = "31999758385";
export const PIX_KEY_EMV = "+5531999758385";

export type Plan = {
  id: Exclude<PlanId, "NONE">;
  name: string;
  priceCents: number;
  price: string;
  period: string;
  forWho: string;
  badge?: string;
  highlight?: boolean;
  peopleCap: number;
  includes: string[];
};

export const PLANS: Plan[] = [
  {
    id: "START",
    name: "Essencial",
    priceCents: 28000,
    price: "R$ 280",
    period: "por mês",
    forWho: "MEI e equipes enxutas que precisam de caixa e gente no mesmo lugar.",
    peopleCap: 8,
    includes: [
      "Financeiro: caixa e títulos",
      "RH: cadastro e ponto",
      "DRE gerencial",
      "Até 8 colaboradores",
      "Renovação mensal no cartão",
      "Cancele quando quiser no painel",
    ],
  },
  {
    id: "BUSINESS",
    name: "Empresa",
    priceCents: 39000,
    price: "R$ 390",
    period: "por mês",
    forWho: "Empresas em crescimento: centros de custo, RH e operação financeira.",
    badge: "Mais usado",
    highlight: true,
    peopleCap: 40,
    includes: [
      "Tudo do Essencial",
      "Centros de custo nos lançamentos",
      "RH: salários, benefícios e ponto",
      "Até 40 colaboradores",
      "Renovação mensal",
      "Cancelamento autônomo",
    ],
  },
  {
    id: "CORP",
    name: "Corporativo",
    priceCents: 50000,
    price: "R$ 500",
    period: "por mês",
    forWho: "Operação grande: sem teto de gente e governança financeira completa.",
    badge: "Completo",
    peopleCap: Number.POSITIVE_INFINITY,
    includes: [
      "Tudo da Empresa",
      "Colaboradores sem limite",
      "DRE e títulos",
      "Multi-tenant com RLS",
      "Renovação mensal",
      "Cancelamento autônomo",
    ],
  },
];

export function planById(id: string | null | undefined): Plan {
  return PLANS.find((p) => p.id === id) ?? PLANS[1];
}

export function parsePlan(value: unknown): PlanId {
  if (value === "START" || value === "BUSINESS" || value === "CORP") return value;
  return "NONE";
}

export function hasCardOnFile(
  user: Pick<Profile, "cardLast4" | "cardExp" | "cardHolder"> | null | undefined,
) {
  return Boolean(user?.cardLast4 && user.cardLast4.length === 4 && user.cardExp && user.cardHolder);
}

export function isSubscribed(user: Profile | null | undefined) {
  if (!user) return false;
  return (
    (user.plan === "START" || user.plan === "BUSINESS" || user.plan === "CORP") &&
    user.billingStatus === "active" &&
    hasCardOnFile(user)
  );
}

export function peopleLimit(user: Profile | null | undefined) {
  if (!isSubscribed(user) || !user) return 0;
  return planById(user.plan).peopleCap;
}

export function hasFinance(user: Profile | null | undefined) {
  return isSubscribed(user);
}

export function hasHr(user: Profile | null | undefined) {
  return isSubscribed(user);
}

export function planLabel(user: Profile | null | undefined) {
  if (!user || user.plan === "NONE") return "sem assinatura";
  return planById(user.plan).name;
}

export function planPriceCents(plan: PlanId) {
  if (plan === "NONE") return 0;
  return planById(plan).priceCents;
}
