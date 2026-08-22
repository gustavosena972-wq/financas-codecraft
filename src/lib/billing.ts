import { planById, type PlanId } from "./plans";

export type PayMethod = "pix" | "card";

export type Billing = {
  plan: PlanId;
  method: PayMethod;
  autoRenew: boolean;
  startedAt: string;
  nextChargeAt: string;
  lastPaidAt: string | null;
  amount: number;
};

const BILL_KEY = "fc-billing";

const CARD_LINKS: Record<Exclude<PlanId, "FREE">, string | undefined> = {
  PRO: process.env.NEXT_PUBLIC_PAY_CASA,
  PLUS: process.env.NEXT_PUBLIC_PAY_CASA_PLUS,
  BUSINESS: process.env.NEXT_PUBLIC_PAY_EMPRESA,
  ENTERPRISE: process.env.NEXT_PUBLIC_PAY_COMPLETO,
};

export function addMonths(iso: string, months = 1) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const day = date.getUTCDate();
  date.setUTCMonth(date.getUTCMonth() + months);
  if (date.getUTCDate() < day) date.setUTCDate(0);
  return date.toISOString();
}

export function startBilling(plan: PlanId, method: PayMethod): Billing {
  const chosen = planById(plan);
  const now = new Date().toISOString();
  return {
    plan,
    method,
    autoRenew: true,
    startedAt: now,
    nextChargeAt: addMonths(now, 1),
    lastPaidAt: now,
    amount: chosen.priceValue ?? 0,
  };
}

export function rollBilling(current: Billing): Billing {
  const paidAt = new Date().toISOString();
  return {
    ...current,
    lastPaidAt: paidAt,
    nextChargeAt: addMonths(current.nextChargeAt || paidAt, 1),
    autoRenew: true,
  };
}

export function daysUntil(iso: string) {
  const t = new Date(iso).getTime() - Date.now();
  return Math.ceil(t / (24 * 60 * 60 * 1000));
}

export function isDue(billing: Billing | null | undefined, graceDays = 3) {
  if (!billing || billing.plan === "FREE" || !billing.autoRenew) return false;
  return daysUntil(billing.nextChargeAt) < -graceDays;
}

export function isComingDue(billing: Billing | null | undefined) {
  if (!billing || billing.plan === "FREE" || !billing.autoRenew) return false;
  const days = daysUntil(billing.nextChargeAt);
  return days <= 5 && days >= -3;
}

export function cardCheckoutUrl(plan: PlanId) {
  if (plan === "FREE") return "";
  return (CARD_LINKS[plan] ?? "").trim();
}

export function loadLocalBilling(userId: string): Billing | null {
  if (typeof window === "undefined" || !userId) return null;
  try {
    const raw = localStorage.getItem(`${BILL_KEY}:${userId}`);
    if (!raw) return null;
    const row = JSON.parse(raw) as Billing;
    if (!row?.plan || !row.method) return null;
    return row;
  } catch {
    return null;
  }
}

export function saveLocalBilling(userId: string, billing: Billing | null) {
  if (typeof window === "undefined" || !userId) return;
  const key = `${BILL_KEY}:${userId}`;
  if (!billing) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(billing));
}

export function parseBilling(raw: unknown): Billing | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Billing;
  if (row.plan !== "PRO" && row.plan !== "PLUS" && row.plan !== "BUSINESS" && row.plan !== "ENTERPRISE") return null;
  if (row.method !== "pix" && row.method !== "card") return null;
  return {
    plan: row.plan,
    method: row.method,
    autoRenew: row.autoRenew !== false,
    startedAt: String(row.startedAt || new Date().toISOString()),
    nextChargeAt: String(row.nextChargeAt || addMonths(new Date().toISOString(), 1)),
    lastPaidAt: row.lastPaidAt ? String(row.lastPaidAt) : null,
    amount: Number(row.amount) || planById(row.plan).priceValue || 0,
  };
}

export function formatChargeDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("pt-BR");
}
