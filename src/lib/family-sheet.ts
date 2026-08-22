import { hashRow, normalizeHeader, type MappedRow } from "./excel";
import { parseMoneyToCents } from "./money";

export type NamedSheet = { name: string; rows: string[][] };

const MONTH_INDEX: Record<string, number> = {
  jan: 1,
  janeiro: 1,
  fev: 2,
  fevereiro: 2,
  mar: 3,
  marco: 3,
  março: 3,
  abr: 4,
  abril: 4,
  mai: 5,
  maio: 5,
  jun: 6,
  junho: 6,
  jul: 7,
  julho: 7,
  ago: 8,
  agosto: 8,
  set: 9,
  setembro: 9,
  out: 10,
  outubro: 10,
  nov: 11,
  novembro: 11,
  dez: 12,
  dezembro: 12,
};

export type FamilyGroup = "cards" | "fixed" | "other" | "income";

export const FAMILY_GROUPS: { id: FamilyGroup; label: string }[] = [
  { id: "cards", label: "Cartões de crédito" },
  { id: "fixed", label: "Fixas / financiamentos" },
  { id: "other", label: "Outras / variáveis" },
];

function fold(value: string) {
  return normalizeHeader(value);
}

export function monthFromSheetName(name: string, year: number) {
  const n = fold(name);
  const named = n.match(/^(jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez|janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s*(20\d{2})?$/);
  if (!named) return null;
  const month = MONTH_INDEX[named[1]];
  if (!month) return null;
  const y = named[2] ? Number(named[2]) : year;
  return `${y}-${String(month).padStart(2, "0")}`;
}

export function classifyFamilyGroup(raw: string): FamilyGroup {
  const n = fold(raw);
  if (/receita|salario|ganho|entrada prevista/.test(n)) return "income";
  if (
    /cartao|nubank|\bwill\b|magazine|luiza|mercado pago|mercado livre|credito/.test(n) ||
    /\binter\b/.test(n) ||
    n.includes("cartoes") ||
    /\bc a\b/.test(n)
  ) {
    return "cards";
  }
  if (/outras|variaveis|pontual/.test(n)) return "other";
  if (
    /fixas|financi|prestacao|casa|luz|agua|internet|condomin|iptu|ipva|celular|netflix|seguro|corem|cruzeiro|tv a cabo|aluguel|moradia/.test(n)
  ) {
    return "fixed";
  }
  return "other";
}

export function familyGroupLabel(group: FamilyGroup) {
  if (group === "cards") return "Cartões de crédito";
  if (group === "fixed") return "Fixas / financiamentos";
  if (group === "income") return "Receita";
  return "Outras / variáveis";
}

function skipRow(text: string) {
  const n = fold(text);
  return (
    /^(total|subtotal|soma|saldo|categoria|item)\b/.test(n) ||
    n.includes("subtotal") ||
    n.includes("total de despesa") ||
    n.includes("total carto") ||
    !n
  );
}

function rowAt(rows: string[][], i: number) {
  return rows[i] ?? [];
}

function looksFamilyMonth(rows: string[][]) {
  const head = rows.slice(0, 8).map((r) => r.map(fold).join(" ")).join(" ");
  return head.includes("categoria") && (head.includes("item") || head.includes("valor"));
}

function parseMonthItems(rows: string[][], month: string): { expenses: MappedRow[]; income: MappedRow[] } {
  let header = 0;
  for (let i = 0; i < Math.min(rows.length, 8); i += 1) {
    const joined = rows[i].map(fold).join(" ");
    if (joined.includes("categoria") && (joined.includes("valor") || joined.includes("item"))) {
      header = i;
      break;
    }
  }
  const expenses: MappedRow[] = [];
  const income: MappedRow[] = [];
  let lastGroup: FamilyGroup = "other";
  const date = `${month}-01`;
  for (let i = header + 1; i < rows.length; i += 1) {
    const row = rowAt(rows, i);
    const groupRaw = (row[0] ?? "").trim();
    const item = (row[1] ?? "").trim() || groupRaw;
    const tag = (row[5] ?? "").trim();
    if (skipRow(item) && skipRow(groupRaw)) continue;
    if (/orcamento/.test(fold(groupRaw))) continue;
    if (groupRaw) {
      const hinted = classifyFamilyGroup(groupRaw);
      if (hinted !== "income") lastGroup = hinted;
    }
    const cents = parseMoneyToCents(row[2] ?? "");
    if (!cents || skipRow(item)) continue;
    const isIncome = classifyFamilyGroup(`${groupRaw} ${item}`) === "income";
    const group = isIncome ? "income" : tag ? classifyFamilyGroup(`${tag} ${item}`) : lastGroup;
    const parcela = (row[3] ?? "").trim();
    const status = (row[4] ?? "").trim();
    const notes = [parcela, status].filter(Boolean).join(" · ");
    if (group === "income") {
      income.push({
        date,
        description: "Receita prevista",
        amount: cents,
        type: "INCOME",
        category: "Receita",
        notes: notes || undefined,
        hash: hashRow(date, "Receita prevista", cents, "INCOME"),
        issues: [],
      });
      continue;
    }
    expenses.push({
      date,
      description: item.slice(0, 80),
      amount: cents,
      type: "EXPENSE",
      category: familyGroupLabel(group),
      account: tag || undefined,
      notes: notes || undefined,
      hash: hashRow(date, item, cents, "EXPENSE"),
      issues: [],
    });
  }
  return { expenses, income };
}

function parseResumoIncome(rows: string[][], year: number): MappedRow[] {
  const out: MappedRow[] = [];
  for (const row of rows) {
    const month = monthFromSheetName(row[0] ?? "", year);
    if (!month) continue;
    const cents = parseMoneyToCents(row[1] ?? "");
    if (!cents) continue;
    const date = `${month}-01`;
    out.push({
      date,
      description: "Receita prevista",
      amount: cents,
      type: "INCOME",
      category: "Receita",
      hash: hashRow(date, "Receita prevista", cents, "INCOME"),
      issues: [],
    });
  }
  return out;
}

export function parseFamilyControl(tables: NamedSheet[], filename: string): MappedRow[] | null {
  const year = Number(filename.match(/20\d{2}/)?.[0] ?? new Date().getFullYear());
  const monthSheets = tables.filter((sheet) => monthFromSheetName(sheet.name, year) && looksFamilyMonth(sheet.rows));
  if (!monthSheets.length) return null;

  const rows: MappedRow[] = [];
  const monthIncome: MappedRow[] = [];
  for (const sheet of monthSheets) {
    const month = monthFromSheetName(sheet.name, year);
    if (!month) continue;
    const parsed = parseMonthItems(sheet.rows, month);
    rows.push(...parsed.expenses);
    monthIncome.push(...parsed.income);
  }
  const resumo = tables.find((sheet) => /resumo/.test(fold(sheet.name)));
  const fromResumo = resumo ? parseResumoIncome(resumo.rows, year) : [];
  const monthsWithResumo = new Set(fromResumo.map((row) => row.date.slice(0, 7)));
  rows.push(...fromResumo);
  rows.push(...monthIncome.filter((row) => !monthsWithResumo.has(row.date.slice(0, 7))));

  if (rows.length < 8) return null;
  return rows;
}
