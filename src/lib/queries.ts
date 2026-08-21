import { endOfMonth, startOfMonth } from "./money";
import { listAccounts, listCategories, listRecurring, listTransactions } from "./store";

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

export function recurringPostedThisMonth(workspaceId: string, month: string, description: string, amount: number) {
  const from = startOfMonth(month).getTime();
  const to = endOfMonth(month).getTime();
  return listTransactions(workspaceId).some((t) => {
    const time = new Date(t.date).getTime();
    return (
      time >= from &&
      time <= to &&
      t.amount === amount &&
      t.description.trim().toLowerCase() === description.trim().toLowerCase()
    );
  });
}

export type AgendaItem = {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  status: "today" | "upcoming" | "overdue";
  source: "tx" | "recurring";
  recurringId?: string;
};

function statusFor(isoDate: string, today: string) {
  if (isoDate === today) return "today" as const;
  return isoDate < today ? ("overdue" as const) : ("upcoming" as const);
}

export function monthAgenda(workspaceId: string, month: string) {
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const items: AgendaItem[] = [];
  const { txs } = monthSummary(workspaceId, month);
  for (const tx of txs.filter((t) => t.type !== "TRANSFER")) {
    const iso = tx.date.slice(0, 10);
    if (iso >= todayIso) {
      items.push({
        id: tx.id,
        date: iso,
        description: tx.description,
        amount: tx.amount,
        type: tx.type === "INCOME" ? "INCOME" : "EXPENSE",
        status: statusFor(iso, todayIso),
        source: "tx",
      });
    }
  }
  const [year, mo] = month.split("-").map(Number);
  for (const rec of listRecurring(workspaceId)) {
    if (recurringPostedThisMonth(workspaceId, month, rec.description, rec.amount)) continue;
    const lastDay = new Date(year, mo, 0).getDate();
    const day = Math.min(rec.day, lastDay);
    const iso = `${month}-${String(day).padStart(2, "0")}`;
    items.push({
      id: rec.id,
      date: iso,
      description: rec.description,
      amount: rec.amount,
      type: rec.type,
      status: statusFor(iso, todayIso),
      source: "recurring",
      recurringId: rec.id,
    });
  }
  return items.sort((a, b) => a.date.localeCompare(b.date) || a.description.localeCompare(b.description));
}

export function projectedCashflow(workspaceId: string, month: string) {
  const accounts = accountBalances(workspaceId);
  const currentBalance = accounts.reduce((s, a) => s + a.balance, 0);
  const { income, expense } = monthSummary(workspaceId, month);
  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  let remainingRecurring = 0;
  if (month === currentMonth) {
    for (const rec of listRecurring(workspaceId)) {
      if (recurringPostedThisMonth(workspaceId, month, rec.description, rec.amount)) continue;
      remainingRecurring += rec.type === "INCOME" ? rec.amount : -rec.amount;
    }
  }
  const projectedBalance = currentBalance + remainingRecurring;
  return { currentBalance, income, expense, projectedBalance, remainingRecurring };
}
