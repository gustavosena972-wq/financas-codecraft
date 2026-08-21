import ExcelJS from "exceljs";
import {
  cellToString,
  hashRow,
  inferType,
  normalizeHeader,
  parseDateCell,
  splitCsv,
  type MappedRow,
} from "./excel";
import { brl, parseMoneyToCents } from "./money";

export type BudgetCell = {
  month: string;
  category: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
};

export type OrganizeResult = {
  error?: string;
  filename: string;
  rows: MappedRow[];
  budgets: BudgetCell[];
  months: { month: string; income: number; expense: number; net: number }[];
  categories: { name: string; income: number; expense: number }[];
  notes: string[];
};

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

const HEADER_MAP: Record<string, string> = {
  data: "date",
  vencimento: "date",
  mes: "date",
  descricao: "description",
  historico: "description",
  item: "description",
  lancamento: "description",
  valor: "amount",
  previsto: "amount",
  orcado: "amount",
  planejado: "amount",
  realizado: "amount",
  tipo: "type",
  categoria: "category",
  conta: "account",
  carteira: "account",
  observacoes: "notes",
};

function yearFromName(filename: string) {
  const found = filename.match(/20\d{2}/);
  return found ? Number(found[0]) : new Date().getFullYear();
}

function monthKeyFromHeader(raw: string, year: number) {
  const n = normalizeHeader(raw);
  if (/^\d{4}-\d{2}$/.test(n)) return n;
  const named = MONTH_INDEX[n];
  if (named) return `${year}-${String(named).padStart(2, "0")}`;
  const num = n.match(/^(0?[1-9]|1[0-2])$/);
  if (num) return `${year}-${String(Number(num[1])).padStart(2, "0")}`;
  return null;
}

function incomeName(name: string) {
  const n = normalizeHeader(name);
  return ["salario", "freelance", "rendimentos", "vendas", "servicos", "outras receitas", "receita"].some((k) =>
    n.includes(k),
  );
}

async function loadTables(buffer: ArrayBuffer, filename: string) {
  const lower = filename.toLowerCase();
  const tables: string[][][] = [];
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
    const delimiter = lines[0]?.includes(";") && !lines[0].includes(",") ? ";" : ",";
    tables.push(lines.map((line) => splitCsv(line, delimiter)));
    return tables;
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  for (const sheet of workbook.worksheets) {
    const rows: string[][] = [];
    sheet.eachRow((row) => {
      const values = (row.values as unknown[]).slice(1).map(cellToString);
      if (values.some((v) => v)) rows.push(values);
    });
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function parseLaunchTable(rows: string[][]): MappedRow[] {
  let headerAt = 0;
  let best = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const score = rows[i].filter((cell) => HEADER_MAP[normalizeHeader(cell)]).length;
    if (score > best) {
      best = score;
      headerAt = i;
    }
  }
  if (best < 2) return [];
  const headers = rows[headerAt].map((h) => HEADER_MAP[normalizeHeader(h)] ?? null);
  const idx = (key: string) => headers.findIndex((h) => h === key);
  const dateIdx = idx("date");
  const descIdx = idx("description");
  const amountIdx = idx("amount");
  if (descIdx < 0 || amountIdx < 0) return [];
  const out: MappedRow[] = [];
  for (const raw of rows.slice(headerAt + 1)) {
    const issues: string[] = [];
    const description = (raw[descIdx] ?? "").trim();
    if (!description || HEADER_MAP[normalizeHeader(description)]) continue;
    const amountRaw = parseMoneyToCents(raw[amountIdx] ?? "");
    if (amountRaw == null) issues.push("Valor inválido");
    const date = dateIdx >= 0 ? parseDateCell(raw[dateIdx]) : null;
    if (dateIdx >= 0 && !date) issues.push("Data inválida");
    const signed = amountRaw ?? 0;
    const type = inferType(idx("type") >= 0 ? raw[idx("type")] : "", signed);
    const amount = Math.abs(signed);
    const isoDate = date ?? "";
    out.push({
      date: isoDate,
      description,
      amount,
      type,
      category: idx("category") >= 0 ? raw[idx("category")] || undefined : undefined,
      account: idx("account") >= 0 ? raw[idx("account")] || undefined : undefined,
      notes: idx("notes") >= 0 ? raw[idx("notes")] || undefined : undefined,
      hash: hashRow(isoDate, description, amount, type),
      issues,
    });
  }
  return out;
}

function parseBudgetGrid(rows: string[][], year: number): BudgetCell[] {
  let headerAt = -1;
  for (let i = 0; i < Math.min(rows.length, 12); i++) {
    const months = rows[i].slice(1).filter((cell) => monthKeyFromHeader(cell, year));
    if (months.length >= 3) {
      headerAt = i;
      break;
    }
  }
  if (headerAt < 0) return [];
  const header = rows[headerAt];
  const monthCols = header.map((cell, i) => ({ i, month: monthKeyFromHeader(cell, year) })).filter((c) => c.month);
  const out: BudgetCell[] = [];
  for (const raw of rows.slice(headerAt + 1)) {
    const category = (raw[0] ?? "").trim();
    if (!category) continue;
    const type = incomeName(category) ? "INCOME" : "EXPENSE";
    for (const col of monthCols) {
      const cents = parseMoneyToCents(raw[col.i] ?? "");
      if (cents == null || cents === 0) continue;
      out.push({ month: col.month!, category, amount: Math.abs(cents), type });
    }
  }
  return out;
}

function summarize(rows: MappedRow[], budgets: BudgetCell[]): OrganizeResult {
  const monthMap = new Map<string, { month: string; income: number; expense: number; net: number }>();
  const catMap = new Map<string, { name: string; income: number; expense: number }>();
  const bump = (month: string, type: "INCOME" | "EXPENSE", amount: number, category?: string) => {
    const current = monthMap.get(month) ?? { month, income: 0, expense: 0, net: 0 };
    if (type === "INCOME") current.income += amount;
    else current.expense += amount;
    current.net = current.income - current.expense;
    monthMap.set(month, current);
    const name = category?.trim() || "Sem categoria";
    const cat = catMap.get(name) ?? { name, income: 0, expense: 0 };
    if (type === "INCOME") cat.income += amount;
    else cat.expense += amount;
    catMap.set(name, cat);
  };
  for (const row of rows.filter((r) => r.issues.length === 0 && r.amount > 0)) {
    const month = row.date ? row.date.slice(0, 7) : "sem-data";
    bump(month, row.type, row.amount, row.category);
  }
  for (const cell of budgets) bump(cell.month, cell.type, cell.amount, cell.category);
  return {
    filename: "",
    rows,
    budgets,
    months: [...monthMap.values()].sort((a, b) => a.month.localeCompare(b.month)),
    categories: [...catMap.values()].sort((a, b) => b.expense + b.income - (a.expense + a.income)),
    notes: [],
  };
}

export function explainOrganized(result: OrganizeResult) {
  const notes: string[] = [];
  const income = result.months.reduce((s, m) => s + m.income, 0);
  const expense = result.months.reduce((s, m) => s + m.expense, 0);
  if (!result.rows.length && !result.budgets.length) {
    return ["Não deu para entender a planilha. Use colunas de data/descrição/valor ou um orçamento com meses."];
  }
  if (result.budgets.length) {
    notes.push(
      `Achei um orçamento com ${new Set(result.budgets.map((b) => b.category)).size} categorias em ${result.months.length} mês(es).`,
    );
  }
  if (result.rows.length) {
    notes.push(`${result.rows.filter((r) => !r.issues.length).length} lançamento(s) ficaram organizados e prontos para o app.`);
  }
  notes.push(`No total: entra ${brl(income)} e sai ${brl(expense)}. Saldo ${brl(income - expense)}.`);
  const top = result.categories.filter((c) => c.expense > 0)[0];
  if (top) notes.push(`O maior peso é ${top.name} (${brl(top.expense)}).`);
  const worst = result.months.filter((m) => m.month !== "sem-data").sort((a, b) => a.net - b.net)[0];
  if (worst && worst.net < 0) notes.push(`${worst.month} foi o mês mais apertado, no vermelho em ${brl(Math.abs(worst.net))}.`);
  return notes;
}

export async function organizeWorkbook(buffer: ArrayBuffer, filename: string): Promise<OrganizeResult> {
  const tables = await loadTables(buffer, filename);
  if (!tables.length) return { error: "Planilha vazia.", filename, rows: [], budgets: [], months: [], categories: [], notes: [] };
  const year = yearFromName(filename);
  const rows: MappedRow[] = [];
  const budgets: BudgetCell[] = [];
  for (const table of tables) {
    const launches = parseLaunchTable(table);
    const grid = parseBudgetGrid(table, year);
    if (grid.length >= 3 && launches.length < 3) budgets.push(...grid);
    else if (launches.length) rows.push(...launches);
    else if (grid.length) budgets.push(...grid);
  }
  const result = summarize(rows, budgets);
  result.filename = filename;
  result.notes = explainOrganized(result);
  if (!result.rows.length && !result.budgets.length) {
    result.error = "Não foi possível organizar. A planilha precisa de lançamentos (data, descrição, valor) ou de um orçamento do ano com meses.";
  }
  return result;
}

export async function buildOrganizedBuffer(result: OrganizeResult) {
  const workbook = new ExcelJS.Workbook();
  const resumo = workbook.addWorksheet("Resumo");
  resumo.addRow(["Planilha organizada — Finanças CodeCraft"]);
  resumo.addRow(["Arquivo original", result.filename]);
  resumo.addRow([]);
  for (const note of result.notes) resumo.addRow([note]);
  resumo.addRow([]);
  resumo.addRow(["Mês", "Receitas", "Despesas", "Saldo"]);
  for (const month of result.months) {
    resumo.addRow([month.month, month.income / 100, month.expense / 100, month.net / 100]);
  }
  resumo.getRow(1).font = { bold: true };

  const cats = workbook.addWorksheet("Por categoria");
  cats.columns = [
    { header: "Categoria", key: "name", width: 24 },
    { header: "Receitas", key: "income", width: 14 },
    { header: "Despesas", key: "expense", width: 14 },
  ];
  for (const cat of result.categories) cats.addRow({ name: cat.name, income: cat.income / 100, expense: cat.expense / 100 });
  cats.getRow(1).font = { bold: true };

  const launches = workbook.addWorksheet("Lancamentos");
  launches.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Descrição", key: "description", width: 36 },
    { header: "Valor", key: "amount", width: 14 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Conta", key: "account", width: 18 },
  ];
  for (const row of result.rows.filter((r) => r.issues.length === 0)) {
    launches.addRow({
      date: row.date,
      description: row.description,
      amount: row.amount / 100,
      type: row.type === "INCOME" ? "Receita" : "Despesa",
      category: row.category ?? "",
      account: row.account ?? "",
    });
  }
  launches.getRow(1).font = { bold: true };

  if (result.budgets.length) {
    const orc = workbook.addWorksheet("Orcamento");
    orc.columns = [
      { header: "Mês", key: "month", width: 12 },
      { header: "Categoria", key: "category", width: 24 },
      { header: "Tipo", key: "type", width: 12 },
      { header: "Valor", key: "amount", width: 14 },
    ];
    for (const cell of result.budgets) {
      orc.addRow({
        month: cell.month,
        category: cell.category,
        type: cell.type === "INCOME" ? "Receita" : "Despesa",
        amount: cell.amount / 100,
      });
    }
    orc.getRow(1).font = { bold: true };
  }
  return workbook.xlsx.writeBuffer();
}
