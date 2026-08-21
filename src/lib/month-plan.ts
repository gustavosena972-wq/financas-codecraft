import type { SheetCharts, SheetTab } from "./coach";
import { formatMonthLabel, monthKey, parseMoneyToCents, shiftMonth } from "./money";

export type MonthPlanRow = { month: string; income: number; expense: number };

function money(cents: number) {
  if (!cents) return "0,00";
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function storageKey(workspaceId: string) {
  return `fc-month-plan-${workspaceId}`;
}

export function planYearMonths(now = monthKey()) {
  const year = Number(now.slice(0, 4));
  const months = Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
  const next = shiftMonth(now, 1);
  if (!months.includes(next)) months.push(next);
  return months;
}

export function loadMonthPlan(workspaceId: string): MonthPlanRow[] {
  if (typeof window === "undefined" || !workspaceId) return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(workspaceId)) || "[]") as MonthPlanRow[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((row) => row && typeof row.month === "string");
  } catch {
    return [];
  }
}

export function saveMonthPlan(workspaceId: string, rows: MonthPlanRow[]) {
  if (typeof window === "undefined" || !workspaceId) return;
  localStorage.setItem(storageKey(workspaceId), JSON.stringify(rows.slice(0, 24)));
}

export function upsertMonthPlan(workspaceId: string, month: string, patch: Partial<Pick<MonthPlanRow, "income" | "expense">>) {
  const rows = loadMonthPlan(workspaceId);
  const index = rows.findIndex((row) => row.month === month);
  const next: MonthPlanRow = {
    month,
    income: 0,
    expense: 0,
    ...(index >= 0 ? rows[index] : {}),
    ...patch,
  };
  if (index >= 0) rows[index] = next;
  else rows.push(next);
  saveMonthPlan(workspaceId, rows);
  return rows;
}

export function buildOrcamentoTab(months: string[], now: string, values: MonthPlanRow[]): SheetTab {
  return {
    id: "orcamento",
    name: "Orçamento",
    headers: ["Mês", "Entra", "Orçamento", "Livre"],
    rows: months.map((month) => {
      const row = values.find((item) => item.month === month) ?? { month, income: 0, expense: 0 };
      return [formatMonthLabel(month), money(row.income), money(row.expense), money(row.income - row.expense)];
    }),
    nowRow: months.indexOf(now),
    monthKeys: months,
    editableCols: [1, 2],
  };
}

export function parseCellMoney(value: string) {
  if (!String(value ?? "").trim()) return 0;
  return Math.abs(parseMoneyToCents(value) ?? 0);
}

export function chartsFromMonths(
  values: MonthPlanRow[],
  now: string,
  extras?: Partial<Pick<SheetCharts, "slices" | "nextFreeIfCut">>,
): SheetCharts {
  const next = shiftMonth(now, 1);
  const thisM = values.find((item) => item.month === now) ?? { month: now, income: 0, expense: 0 };
  const nextM = values.find((item) => item.month === next) ?? thisM;
  const thisFree = thisM.income - thisM.expense;
  const nextFree = nextM.income - nextM.expense;
  const nextFreeIfCut = extras?.nextFreeIfCut ?? nextFree;
  return {
    thisFree,
    nextFree,
    nextFreeIfCut,
    nextIncome: nextM.income,
    nextPay: nextM.expense,
    nextPayIfCut: Math.max(0, nextM.expense - Math.max(0, nextFreeIfCut - nextFree)),
    thisLabel: formatMonthLabel(now),
    nextLabel: formatMonthLabel(next),
    series: values.map((item) => ({
      month: item.month,
      income: item.income,
      expense: item.expense,
      net: item.income - item.expense,
    })),
    slices: extras?.slices ?? [],
  };
}
