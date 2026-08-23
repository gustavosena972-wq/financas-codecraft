import { classifyFamilyGroup, familyGroupLabel, type FamilyGroup } from "./family-sheet";
import { monthKey } from "./money";
import { monthSummary } from "./queries";

export type FamilyMonth = {
  month: string;
  income: number;
  cards: number;
  fixed: number;
  other: number;
  expense: number;
  net: number;
  cardShare: number;
};

export type FamilyItem = {
  id: string;
  group: FamilyGroup;
  description: string;
  amount: number;
  notes?: string;
};

function yearMonths(year: number) {
  return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, "0")}`);
}

function groupOf(category: string, description: string): FamilyGroup {
  const fromCat = classifyFamilyGroup(category);
  if (category && (fromCat !== "other" || /cartao|fixas|outras/.test(category.toLowerCase()))) return fromCat;
  return classifyFamilyGroup(`${category} ${description}`);
}

export function familyYear(workspaceId: string, year = new Date().getFullYear()): FamilyMonth[] {
  return yearMonths(year).map((month) => {
    const summary = monthSummary(workspaceId, month);
    let income = 0;
    let cards = 0;
    let fixed = 0;
    let other = 0;
    for (const tx of summary.txs) {
      if (tx.type === "TRANSFER") continue;
      // Ignora linha monstro (lixo de importação antiga, ex. R$ 194 mil).
      if (tx.amount >= 50_000_00) continue;
      if (tx.type === "INCOME") {
        income += tx.amount;
        continue;
      }
      if (tx.type !== "EXPENSE") continue;
      const group = groupOf(tx.category?.name ?? "", tx.description);
      if (group === "cards") cards += tx.amount;
      else if (group === "fixed") fixed += tx.amount;
      else other += tx.amount;
    }
    let expense = cards + fixed + other;
    // Mês inteiro corrompido: não mostra o lixo na tabela.
    if (expense >= 80_000_00) {
      income = 0;
      cards = 0;
      fixed = 0;
      other = 0;
      expense = 0;
    }
    return {
      month,
      income,
      cards,
      fixed,
      other,
      expense,
      net: income - expense,
      cardShare: expense ? cards / expense : 0,
    };
  });
}

export function familyMonthItems(workspaceId: string, month: string): FamilyItem[] {
  const summary = monthSummary(workspaceId, month);
  return summary.txs
    .filter((tx) => tx.type === "EXPENSE")
    .map((tx) => ({
      id: tx.id,
      group: groupOf(tx.category?.name ?? "", tx.description),
      description: tx.description,
      amount: tx.amount,
      notes: tx.notes || undefined,
    }))
    .sort((a, b) => {
      const order: Record<FamilyGroup, number> = { cards: 0, fixed: 1, other: 2, income: 3 };
      return order[a.group] - order[b.group] || a.description.localeCompare(b.description, "pt-BR");
    });
}

export const CARD_CUT_DEFAULT = 0.1;

export function cardMetaFromTotals(totals: number[], cutPct = CARD_CUT_DEFAULT, baseIndex = 8) {
  const base = totals[baseIndex] ?? 0;
  if (!base) return { baseIndex, cutPct, values: totals.map(() => 0) };
  const values = totals.map((_, i) => {
    if (i < baseIndex) return 0;
    return Math.round(base * (1 - cutPct) ** (i - baseIndex));
  });
  return { baseIndex, cutPct, values };
}

export function cardEvolution(workspaceId: string, year = new Date().getFullYear()) {
  const months = yearMonths(year);
  const names = new Map<string, number[]>();
  months.forEach((month, index) => {
    const summary = monthSummary(workspaceId, month);
    for (const tx of summary.txs) {
      if (tx.type !== "EXPENSE") continue;
      if (groupOf(tx.category?.name ?? "", tx.description) !== "cards") continue;
      const name = tx.description.replace(/^cart[aã]o\s+/i, "").trim() || tx.description;
      const row = names.get(name) ?? Array(12).fill(0);
      row[index] += tx.amount;
      names.set(name, row);
    }
  });
  const cards = [...names.entries()]
    .map(([name, values]) => ({ name, values, total: values.reduce((s, n) => s + n, 0) }))
    .sort((a, b) => b.total - a.total);
  const totals = Array(12).fill(0).map((_, i) => cards.reduce((s, row) => s + row.values[i], 0));
  return { months, cards, totals };
}

export function familyNow(workspaceId: string) {
  const year = Number(monthKey().slice(0, 4));
  const series = familyYear(workspaceId, year);
  const used = series.filter((row) => row.income > 0 || row.expense > 0);
  const now = series.find((row) => row.month === monthKey()) ?? used[used.length - 1] ?? series[0];
  const totals = used.reduce(
    (acc, row) => ({
      income: acc.income + row.income,
      cards: acc.cards + row.cards,
      fixed: acc.fixed + row.fixed,
      other: acc.other + row.other,
      expense: acc.expense + row.expense,
      net: acc.net + row.net,
    }),
    { income: 0, cards: 0, fixed: 0, other: 0, expense: 0, net: 0 },
  );
  return { year, series, used, now, totals, empty: !used.length };
}

export { familyGroupLabel };
export type { FamilyGroup };
