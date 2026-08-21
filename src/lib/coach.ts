import { brl, formatMonthLabel, monthKey, shiftMonth } from "./money";
import { accountBalances, categorySpend, monthSummary } from "./queries";
import { listRecurring } from "./store";

export type SheetRow = {
  month: string;
  label: string;
  income: number;
  expense: number;
  net: number;
  balance: number;
  kind: "past" | "now" | "future";
};

export type CutTip = {
  title: string;
  body: string;
  save: number;
};

function averagePositive(values: number[]) {
  const usable = values.filter((value) => value > 0);
  if (!usable.length) return 0;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function buildMoneySheet(workspaceId: string, paid = false, futureCount = paid ? 11 : 1) {
  const now = monthKey();
  const history = [shiftMonth(now, -2), shiftMonth(now, -1), now].map((month) => ({
    month,
    ...monthSummary(workspaceId, month),
  }));
  const incomeAvg = averagePositive(history.map((row) => row.income));
  const expenseAvg = averagePositive(history.map((row) => row.expense));
  const current = monthSummary(workspaceId, now);
  const currentBalance = accountBalances(workspaceId).reduce((sum, account) => sum + account.balance, 0);

  const past = [shiftMonth(now, -2), shiftMonth(now, -1)].map((month) => {
    const summary = monthSummary(workspaceId, month);
    return {
      month,
      label: formatMonthLabel(month),
      income: summary.income,
      expense: summary.expense,
      net: summary.net,
      balance: 0,
      kind: "past" as const,
    };
  });

  const nowRow: SheetRow = {
    month: now,
    label: formatMonthLabel(now),
    income: current.income,
    expense: current.expense,
    net: current.net,
    balance: currentBalance,
    kind: "now",
  };

  const future: SheetRow[] = [];
  let running = currentBalance;
  for (let i = 1; i <= futureCount; i += 1) {
    const month = shiftMonth(now, i);
    const net = incomeAvg - expenseAvg;
    running += net;
    future.push({
      month,
      label: formatMonthLabel(month),
      income: incomeAvg,
      expense: expenseAvg,
      net,
      balance: running,
      kind: "future",
    });
  }

  const tips: CutTip[] = [];
  let saveMonth = 0;
  const top = categorySpend(workspaceId, now)[0];
  if (top && current.expense > 0 && top.amount / current.expense >= 0.18) {
    const cut = Math.round(top.amount * 0.2);
    saveMonth += cut;
    tips.push({
      title: `Cortar 20% de ${top.name}`,
      body: `${top.name} levou ${brl(top.amount)} neste mês. Se baixar um quinto, o caixa ganha ${brl(cut)} por mês.`,
      save: cut,
    });
  }

  const bills = listRecurring(workspaceId)
    .filter((item) => item.type === "EXPENSE")
    .sort((a, b) => b.amount - a.amount);
  const named = bills.filter((item) =>
    /(netflix|spotify|disney|prime|assinat|claro|vivo|tim|internet|aluguel|academia|luz|energia|agua)/.test(
      normalize(item.description),
    ),
  );
  for (const bill of (named.length ? named : bills).slice(0, 2)) {
    const cut = Math.round(bill.amount * 0.15);
    if (!cut) continue;
    saveMonth += cut;
    tips.push({
      title: `Baixar a conta ${bill.description}`,
      body: `Todo mês sai ${brl(bill.amount)}. Se negociar 15% ou trocar de plano, você gasta ${brl(cut)} a menos.`,
      save: cut,
    });
  }

  if (current.net < 0) {
    tips.push({
      title: "O mês ainda está no vermelho",
      body: `Faltou ${brl(Math.abs(current.net))}. Comece pelo maior gasto e pelas contas que se repetem.`,
      save: 0,
    });
  } else if (current.income > 0 && current.net / current.income < 0.1 && current.expense > 0) {
    tips.push({
      title: "Sobra pouco",
      body: `Deste mês ficou ${brl(current.net)}. Uma meta simples é guardar 10% do que entra.`,
      save: 0,
    });
  }

  return {
    rows: [...past, nowRow, ...future],
    incomeAvg,
    expenseAvg,
    saveMonth,
    yearSave: saveMonth * 12,
    tips: paid ? tips.slice(0, 4) : tips.slice(0, 1),
    empty: history.every((row) => !row.txs.length),
    paid,
  };
}
