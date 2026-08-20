import { endOfMonth, startOfMonth } from "./money";
import { listAccounts, listCategories, listTransactions } from "./store";

export function accountBalances(workspaceId: string) {
  const accounts = listAccounts(workspaceId);
  const txs = listTransactions(workspaceId);
  return accounts.map((account) => {
    let balance = account.initialBalance;
    for (const tx of txs) {
      if (tx.accountId === account.id) {
        if (tx.type === "INCOME") balance += tx.amount;
        if (tx.type === "EXPENSE") balance -= tx.amount;
        if (tx.type === "TRANSFER") balance -= tx.amount;
      }
      if (tx.type === "TRANSFER" && tx.transferToAccountId === account.id) {
        balance += tx.amount;
      }
    }
    return { ...account, balance };
  });
}

export function monthSummary(workspaceId: string, month: string) {
  const from = startOfMonth(month).getTime();
  const to = endOfMonth(month).getTime();
  const accounts = listAccounts(workspaceId, true);
  const categories = listCategories(workspaceId);
  const txs = listTransactions(workspaceId)
    .filter((t) => {
      const time = new Date(t.date).getTime();
      return time >= from && time <= to;
    })
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => ({
      ...t,
      account: accounts.find((a) => a.id === t.accountId)!,
      category: categories.find((c) => c.id === t.categoryId) ?? null,
    }));
  const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  return { txs, income, expense, net: income - expense };
}

export function cashflowSeries(workspaceId: string, months = 6) {
  const now = new Date();
  const series: { month: string; income: number; expense: number; net: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const { income, expense, net } = monthSummary(workspaceId, month);
    series.push({ month, income, expense, net });
  }
  return series;
}

export function categorySpend(workspaceId: string, month: string) {
  const { txs } = monthSummary(workspaceId, month);
  const map = new Map<string, { name: string; color: string; amount: number }>();
  for (const tx of txs.filter((t) => t.type === "EXPENSE")) {
    const name = tx.category?.name ?? "Sem categoria";
    const color = tx.category?.color ?? "#8C97A3";
    const current = map.get(name) ?? { name, color, amount: 0 };
    current.amount += tx.amount;
    map.set(name, current);
  }
  return [...map.values()].sort((a, b) => b.amount - a.amount);
}

export function projectedCashflow(workspaceId: string, month: string) {
  const accounts = accountBalances(workspaceId);
  const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const { income, expense } = monthSummary(workspaceId, month);
  const today = new Date();
  const day = today.getDate();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const elapsed = Math.max(day, 1);
  const dailyNet = (income - expense) / elapsed;
  const projectedBalance = currentBalance + Math.round(dailyNet * (daysInMonth - elapsed));
  return { currentBalance, income, expense, projectedBalance };
}
