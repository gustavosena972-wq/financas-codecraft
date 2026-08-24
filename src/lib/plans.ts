import type { PlanId, Profile } from "./types";

export const PLAN_PRICE_CENTS = 24900;
export const PIX_KEY = "31999758385";
export const PIX_KEY_EMV = "+5531999758385";

export const PLAN = {
  id: "PRO" as const,
  name: "Finanças CodeCraft",
  price: "R$ 249",
  period: "por mês",
  forWho:
    "Um sistema só. O cartão cobra sozinho todo mês. Quem preferir, paga a assinatura no PIX da plataforma.",
  includes: [
    "Todos os setores liberados",
    "Pessoas, vendas, projetos, caixa e estoque sem teto",
    "IA autônoma em 95% do trabalho",
    "Cartão: cobrança automática todo mês",
    "PIX da plataforma para pagar a assinatura",
    "Cancele quando quiser",
  ],
};

export function isSubscribed(user: Pick<Profile, "plan" | "billingStatus"> | null | undefined) {
  return user?.plan === "PRO" && user.billingStatus === "active";
}

export function peopleLimit(user: Pick<Profile, "plan" | "billingStatus"> | null | undefined) {
  return isSubscribed(user) ? Number.POSITIVE_INFINITY : 0;
}

export function aiLimit(user: Pick<Profile, "plan" | "billingStatus"> | null | undefined) {
  return isSubscribed(user) ? Number.POSITIVE_INFINITY : 0;
}

export function hasCash(user: Pick<Profile, "plan" | "billingStatus"> | null | undefined) {
  return isSubscribed(user);
}

export function hasOps(user: Pick<Profile, "plan" | "billingStatus"> | null | undefined) {
  return isSubscribed(user);
}

export function planLabel(user: Pick<Profile, "plan" | "billingStatus"> | null | undefined) {
  return isSubscribed(user) ? PLAN.name : "sem assinatura";
}

export function parsePlan(value: unknown): PlanId {
  return value === "PRO" ? "PRO" : "NONE";
}
