import { listBills, listCategories, listCostCenters } from "./store";
import { monthSummary } from "./queries";

export function buildDre(workspaceId: string, month: string) {
  const summary = monthSummary(workspaceId, month);
  const categories = listCategories(workspaceId);
  const incomeRows = rollup(summary.txs.filter((t) => t.type === "INCOME"), categories, "INCOME");
  const expenseRows = rollup(summary.txs.filter((t) => t.type === "EXPENSE"), categories, "EXPENSE");
  const margin = summary.income > 0 ? Math.round((summary.net / summary.income) * 100) : 0;
  return {
    incomeRows,
    expenseRows,
    income: summary.income,
    expense: summary.expense,
    net: summary.net,
    margin,
    count: summary.txs.length,
  };
}

function rollup(
  txs: { categoryId: string | null; amount: number; category?: { name: string } | null }[],
  categories: { id: string; name: string }[],
  fallbackKind: string,
) {
  const map = new Map<string, number>();
  for (const tx of txs) {
    const name = tx.category?.name ?? categories.find((c) => c.id === tx.categoryId)?.name ?? (fallbackKind === "INCOME" ? "Receita sem categoria" : "Despesa sem categoria");
    map.set(name, (map.get(name) ?? 0) + tx.amount);
  }
  return [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);
}

export function billsOverview(workspaceId: string, today = new Date()) {
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const bills = listBills(workspaceId);
  const open = bills.filter((b) => b.status === "OPEN");
  const payables = open.filter((b) => b.kind === "PAYABLE");
  const receivables = open.filter((b) => b.kind === "RECEIVABLE");
  const overduePay = payables.filter((b) => b.due < iso);
  const overdueRec = receivables.filter((b) => b.due < iso);
  return {
    payables: sum(payables),
    receivables: sum(receivables),
    overduePay: sum(overduePay),
    overdueRec: sum(overdueRec),
    openCount: open.length,
    aging: {
      current: sum(open.filter((b) => b.due >= iso)),
      d7: sum(open.filter((b) => b.due < iso && daysBetween(b.due, iso) <= 7)),
      d30: sum(open.filter((b) => daysBetween(b.due, iso) > 7 && daysBetween(b.due, iso) <= 30)),
      d30p: sum(open.filter((b) => daysBetween(b.due, iso) > 30)),
    },
  };
}

function sum(items: { amount: number }[]) {
  return items.reduce((s, i) => s + i.amount, 0);
}

function daysBetween(from: string, to: string) {
  const a = new Date(`${from}T12:00:00`).getTime();
  const b = new Date(`${to}T12:00:00`).getTime();
  return Math.floor((b - a) / 86400000);
}

export function spendByCostCenter(workspaceId: string) {
  const centers = listCostCenters(workspaceId);
  const bills = listBills(workspaceId).filter((b) => b.kind === "PAYABLE");
  return centers.map((center) => ({
    name: center.name,
    amount: bills.filter((b) => b.costCenterId === center.id).reduce((s, b) => s + b.amount, 0),
  }));
}
