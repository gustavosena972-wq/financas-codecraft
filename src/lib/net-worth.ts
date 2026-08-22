import { formatMonthLabel } from "./money";
import { accountBalances, cashflowSeries } from "./queries";
import { listHoldings } from "./store";

export function netWorthSnapshot(workspaceId: string) {
  const accounts = accountBalances(workspaceId);
  const holdings = listHoldings(workspaceId);
  let assets = 0;
  let debts = 0;
  for (const account of accounts) {
    if (account.type === "CREDIT") debts += Math.abs(account.balance);
    else assets += account.balance;
  }
  const invested = holdings.reduce((sum, item) => sum + item.value, 0);
  assets += invested;
  return {
    assets,
    debts,
    invested,
    net: assets - debts,
    accounts,
    holdings,
  };
}

export function netWorthSeries(workspaceId: string, months = 12) {
  const now = netWorthSnapshot(workspaceId).net;
  const flow = cashflowSeries(workspaceId, months);
  const rows: { month: string; label: string; worth: number }[] = [];
  let cursor = now;
  for (let i = flow.length - 1; i >= 0; i--) {
    rows.unshift({ month: flow[i].month, label: formatMonthLabel(flow[i].month), worth: cursor });
    cursor -= flow[i].net;
  }
  return rows;
}
