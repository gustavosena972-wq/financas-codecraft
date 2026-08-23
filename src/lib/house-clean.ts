import { normalizeHeader } from "./excel";
import type { Transaction } from "./types";

function fold(value: string) {
  return normalizeHeader(value);
}

function looksLikeSheetTotal(tx: Transaction) {
  const n = fold(`${tx.description} ${tx.notes ?? ""}`);
  return (
    /^(total|subtotal|soma|saldo)\b/.test(n) ||
    n.includes("total de despesa") ||
    n.includes("total carto") ||
    n.includes("resumo") ||
    n.includes("evolucao")
  );
}

function fingerprint(tx: Transaction) {
  if (tx.importHash) return `h:${tx.importHash}`;
  return `k:${tx.date.slice(0, 10)}|${tx.amount}|${tx.type}|${fold(tx.description)}`;
}

function monthOf(tx: Transaction) {
  return tx.date.slice(0, 7);
}

function summaryLines(txs: Transaction[]) {
  const ids = new Set<string>();
  const months = new Map<string, Transaction[]>();
  for (const tx of txs) {
    if (tx.type === "TRANSFER") continue;
    const list = months.get(monthOf(tx)) ?? [];
    list.push(tx);
    months.set(monthOf(tx), list);
  }
  for (const rows of months.values()) {
    for (const type of ["INCOME", "EXPENSE"] as const) {
      const group = rows.filter((tx) => tx.type === type);
      if (group.length < 3) continue;
      for (const candidate of group) {
        const rest = group.filter((tx) => tx.id !== candidate.id).reduce((s, tx) => s + tx.amount, 0);
        if (rest > 0 && candidate.amount === rest) ids.add(candidate.id);
      }
    }
  }
  return ids;
}

export function stackedIdsFrom(list: Transaction[]) {
  const txs = list.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const remove = new Set<string>();
  const seen = new Set<string>();
  for (const tx of txs) {
    if (looksLikeSheetTotal(tx)) {
      remove.add(tx.id);
      continue;
    }
    const key = fingerprint(tx);
    if (seen.has(key)) {
      remove.add(tx.id);
      continue;
    }
    seen.add(key);
  }
  for (const id of summaryLines(txs.filter((tx) => !remove.has(tx.id)))) remove.add(id);
  return [...remove];
}

/** Lixo de importação antiga: total do ano jogado no mês (ex.: R$ 194 mil em agosto). */
export function dumpIdsFrom(list: Transaction[]) {
  const remove = new Set<string>();
  for (const tx of list) {
    if (tx.type === "TRANSFER") continue;
    if (tx.amount >= 50_000_00) remove.add(tx.id);
  }
  const months = new Map<string, Transaction[]>();
  for (const tx of list) {
    if (remove.has(tx.id) || tx.type === "TRANSFER") continue;
    const key = monthOf(tx);
    const rows = months.get(key) ?? [];
    rows.push(tx);
    months.set(key, rows);
  }
  for (const rows of months.values()) {
    const expense = rows.filter((tx) => tx.type === "EXPENSE").reduce((s, tx) => s + tx.amount, 0);
    if (expense < 80_000_00) continue;
    for (const tx of rows) remove.add(tx.id);
  }
  return [...remove];
}

export async function cleanStackedHouse(workspaceId: string) {
  const { deleteTransaction, listTransactions } = await import("./store");
  const list = listTransactions(workspaceId);
  const ids = [...new Set([...stackedIdsFrom(list), ...dumpIdsFrom(list)])];
  for (const id of ids) {
    await deleteTransaction(id, workspaceId);
  }
  return ids.length;
}

export function houseYearLooksWrong(expense: number, monthExpense: number) {
  return expense >= 150_000_00 || monthExpense >= 80_000_00;
}

export async function resetHouseYear(workspaceId: string, year = new Date().getFullYear()) {
  const { deleteTransaction, listTransactions } = await import("./store");
  const prefix = `${year}-`;
  const txs = listTransactions(workspaceId).filter((tx) => tx.date.startsWith(prefix));
  for (const tx of txs) {
    await deleteTransaction(tx.id, workspaceId);
  }
  return txs.length;
}

export async function resetHouseSheet(workspaceId: string) {
  const { wipeWorkspaceMoney } = await import("./store");
  return wipeWorkspaceMoney(workspaceId);
}
