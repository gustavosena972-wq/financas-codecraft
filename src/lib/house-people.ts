import { normalizeHeader } from "./excel";
import { brl, monthKey } from "./money";
import { listTransactions } from "./store";
import type { Transaction } from "./types";

export const HOUSE_PEOPLE = ["Sandra", "Hudson", "Heitor"] as const;
export type HousePersonName = (typeof HOUSE_PEOPLE)[number] | "A casa";

export type HousePersonRow = {
  name: HousePersonName;
  spent: number;
  pending: number;
  lastWhat?: string;
  status: "spending" | "quiet";
};

export type HouseSpendWatch = {
  people: HousePersonRow[];
  spent: number;
  pending: number;
  newSpend: { who: string; amount: number; what: string; when: string }[];
  headline: string;
  body: string;
  tone: "ok" | "warn" | "info";
};

function fold(value: string) {
  return normalizeHeader(value);
}

export function personOf(text: string): HousePersonName {
  const n = fold(text);
  if (/giliad|giliard|lava.?carro|lavagem/.test(n)) return "A casa";
  for (const name of HOUSE_PEOPLE) {
    if (n.includes(fold(name))) return name;
  }
  return "A casa";
}

export function spendState(tx: Pick<Transaction, "notes" | "importHash" | "date" | "createdAt">): "spent" | "pending" {
  const notes = fold(tx.notes ?? "");
  if (/pg|pago|realizado|baixado|quitado/.test(notes)) return "spent";
  if (/aberto|pendente|a pagar|nao pago/.test(notes)) return "pending";
  if (!tx.importHash) return "spent";
  return "pending";
}

function dayOf(value: string) {
  return value.slice(0, 10);
}

function recent(tx: Transaction, today: string, days = 7) {
  const when = dayOf(tx.createdAt || tx.date);
  if (when > today) return false;
  const start = new Date(`${today}T12:00:00`);
  start.setDate(start.getDate() - days);
  return when >= start.toISOString().slice(0, 10);
}

export function houseSpendWatch(workspaceId: string, month = monthKey(), today = new Date().toISOString().slice(0, 10)): HouseSpendWatch {
  const txs = listTransactions(workspaceId).filter((tx) => tx.type === "EXPENSE" && tx.date.startsWith(month));
  const byName = new Map<HousePersonName, HousePersonRow>();
  for (const name of [...HOUSE_PEOPLE, "A casa"] as HousePersonName[]) {
    byName.set(name, { name, spent: 0, pending: 0, status: "quiet" });
  }

  for (const tx of txs) {
    const who = personOf(`${tx.description} ${tx.notes ?? ""}`);
    const row = byName.get(who) ?? byName.get("A casa")!;
    const state = spendState(tx);
    if (state === "spent") {
      row.spent += tx.amount;
      row.lastWhat = tx.description;
      row.status = "spending";
    } else {
      row.pending += tx.amount;
    }
    byName.set(row.name, row);
  }

  const people = [...byName.values()].filter((row) => row.spent || row.pending || row.name !== "A casa");
  const spent = people.reduce((s, row) => s + row.spent, 0);
  const pending = people.reduce((s, row) => s + row.pending, 0);
  const newSpend = txs
    .filter((tx) => spendState(tx) === "spent" && recent(tx, today))
    .sort((a, b) => (b.createdAt || b.date).localeCompare(a.createdAt || a.date))
    .slice(0, 5)
    .map((tx) => ({
      who: personOf(`${tx.description} ${tx.notes ?? ""}`),
      amount: tx.amount,
      what: tx.description,
      when: dayOf(tx.createdAt || tx.date),
    }));

  const spending = people.filter((row) => row.name !== "A casa" && row.status === "spending").map((row) => row.name);
  const quiet = HOUSE_PEOPLE.filter((name) => !spending.includes(name));
  const todayNew = newSpend.filter((row) => row.when === today);

  let headline = "Ninguém anotou gasto novo hoje.";
  let body = `Já saiu ${brl(spent)}. Ainda não saiu ${brl(pending)}. Se ninguém gastar no cartão, esse número se segura.`;
  let tone: HouseSpendWatch["tone"] = "ok";

  if (todayNew.length) {
    const names = [...new Set(todayNew.map((row) => row.who))];
    const total = todayNew.reduce((s, row) => s + row.amount, 0);
    headline = names.length > 1 ? `${names.join(" e ")} gastaram hoje.` : `${names[0]} gastou hoje.`;
    body = `Saiu ${brl(total)} hoje. Já saiu ${brl(spent)} neste mês. Ainda não saiu ${brl(pending)}.`;
    tone = "warn";
  } else if (spending.length && quiet.length) {
    const verb = spending.length > 1 ? "estão gastando" : "está gastando";
    const quietVerb = quiet.length > 1 ? "não mexeram" : "não mexeu";
    headline = `${spending.join(" e ")} ${verb}. ${quiet.join(" e ")} ${quietVerb}.`;
    body = `Já saiu ${brl(spent)}. Ainda não saiu ${brl(pending)}. Quem está quieto não abre parcela nova.`;
    tone = "info";
  } else if (spending.length) {
    headline = spending.length > 1 ? `${spending.join(" e ")} estão gastando neste mês.` : `${spending[0]} está gastando neste mês.`;
    body = `Já saiu ${brl(spent)}. Ainda não saiu ${brl(pending)}.`;
    tone = "info";
  } else if (pending) {
    headline = "Ainda ninguém gastou além do combinado.";
    body = `O que está na planilha ainda vai sair: ${brl(pending)}. Sem gasto novo no cartão, o mês se segura.`;
  }

  return { people, spent, pending, newSpend, headline, body, tone };
}

export function peopleSpeech(watch: HouseSpendWatch) {
  const lines = watch.people
    .filter((row) => row.name !== "A casa")
    .map((row) =>
      row.status === "spending"
        ? `${row.name} já gastou ${brl(row.spent)}`
        : `${row.name} não gastou neste mês`,
    );
  return `${watch.headline} ${watch.body} ${lines.join(". ")}.`;
}
