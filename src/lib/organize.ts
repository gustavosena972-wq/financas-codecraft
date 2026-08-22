import ExcelJS from "exceljs";
import {
  cellToString,
  hashRow,
  inferType,
  mapColumnHeader,
  normalizeHeader,
  parseDateCell,
  splitCsv,
  type MappedRow,
} from "./excel";
import { parseFamilyControl, type NamedSheet } from "./family-sheet";
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

function yearFromName(filename: string) {
  const found = filename.match(/20\d{2}/);
  return found ? Number(found[0]) : new Date().getFullYear();
}

function monthKeyFromHeader(raw: string, year: number) {
  const text = String(raw ?? "").trim();
  if (!text) return null;
  const n = normalizeHeader(text);
  const yFirst = n.match(/^(20\d{2})[\s\/\-.]?(0?[1-9]|1[0-2])$/);
  if (yFirst) return `${yFirst[1]}-${String(Number(yFirst[2])).padStart(2, "0")}`;
  const my = n.match(/^(0?[1-9]|1[0-2])[\s\/\-.](20\d{2}|\d{2})$/);
  if (my) {
    const y = my[2].length === 2 ? 2000 + Number(my[2]) : Number(my[2]);
    return `${y}-${String(Number(my[1])).padStart(2, "0")}`;
  }
  const isoMonth = n.match(/^(20\d{2}) (\d{2})(?: \d{2})?$/);
  if (isoMonth) return `${isoMonth[1]}-${isoMonth[2]}`;
  const namedPart = n.replace(/[\s\/.\-]+(20\d{2}|\d{2})$/, "").trim();
  const named = MONTH_INDEX[n] ?? MONTH_INDEX[namedPart] ?? MONTH_INDEX[namedPart.split(" ")[0] ?? ""];
  if (named) {
    const yearMatch = n.match(/(20\d{2}|\d{2})$/);
    const hasYear = Boolean(yearMatch && namedPart !== n);
    const y = hasYear ? (yearMatch![1].length === 2 ? 2000 + Number(yearMatch![1]) : Number(yearMatch![1])) : year;
    return `${y}-${String(named).padStart(2, "0")}`;
  }
  const asDate = parseDateCell(text);
  if (asDate) {
    const serial = Number(text);
    if (
      /^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(text) ||
      /^\d{4}-\d{2}-\d{2}/.test(text) ||
      (Number.isFinite(serial) && serial > 20000 && serial < 80000)
    ) {
      return asDate.slice(0, 7);
    }
  }
  const num = n.match(/^(0?[1-9]|1[0-2])$/);
  if (num) return `${year}-${String(Number(num[1])).padStart(2, "0")}`;
  return null;
}

function incomeName(name: string) {
  const n = normalizeHeader(name);
  return [
    "salario",
    "freelance",
    "rendimentos",
    "vendas",
    "servicos",
    "outras receitas",
    "receita",
    "ferias",
    "restituicao",
    "pro labore",
    "prolabore",
    "honorario",
    "decimo",
  ].some((k) => n.includes(k));
}

function skipSummary(text: string) {
  const n = normalizeHeader(text);
  return /^(total|subtotal|soma|saldo|resultado|geral|acumulado)\b/.test(n);
}

function todayISO() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function guessType(typeRaw: string, description: string, signed: number): "INCOME" | "EXPENSE" {
  if (typeRaw.trim()) return inferType(typeRaw, signed);
  if (signed < 0) return "EXPENSE";
  if (incomeName(description)) return "INCOME";
  return "EXPENSE";
}

function detectDelimiter(firstLine: string) {
  let inQuotes = false;
  const counts = { ";": 0, ",": 0, "\t": 0, "|": 0 };
  for (const ch of firstLine) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch in counts) counts[ch as keyof typeof counts] += 1;
  }
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return entries[0][1] > 0 ? entries[0][0] : ",";
}

function sheetToMatrix(sheet: ExcelJS.Worksheet) {
  const rows: string[][] = [];
  sheet.eachRow((row) => {
    const values: string[] = [];
    row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      const shown = typeof cell.text === "string" ? cell.text.trim() : "";
      values[colNumber - 1] = shown || cellToString(cell.value);
    });
    for (let i = 0; i < values.length; i++) values[i] = values[i] ?? "";
    if (values.some((v) => v.trim())) rows.push(values);
  });
  return rows;
}

async function loadTables(buffer: ArrayBuffer, filename: string): Promise<NamedSheet[]> {
  const lower = filename.toLowerCase();
  const tables: NamedSheet[] = [];
  const asText = () => {
    let text = new TextDecoder("utf-8").decode(buffer);
    if (text.includes("\uFFFD") || (text.match(/Ã./g) ?? []).length > 8) {
      text = new TextDecoder("iso-8859-1").decode(buffer);
    }
    text = text.replace(/^\uFEFF/, "");
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
    if (!lines.length) return;
    const delimiter = detectDelimiter(lines[0]);
    tables.push({ name: filename, rows: lines.map((line) => splitCsv(line, delimiter)) });
  };
  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    asText();
    return tables;
  }
  if (lower.endsWith(".xls") && !lower.endsWith(".xlsx")) {
    return tables;
  }
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    for (const sheet of workbook.worksheets) {
      const rows = sheetToMatrix(sheet);
      if (rows.length) tables.push({ name: sheet.name || "Planilha", rows });
    }
  } catch {
    asText();
  }
  return tables;
}

function toLaunch(
  date: string,
  description: string,
  signed: number,
  typeRaw: string,
  category?: string,
  account?: string,
  notes?: string,
): MappedRow | null {
  const clean = description.trim();
  if (!clean || skipSummary(clean)) return null;
  const amount = Math.abs(signed);
  if (!amount) return null;
  const type = guessType(typeRaw, clean, signed);
  const isoDate = date || todayISO();
  return {
    date: isoDate,
    description: clean,
    amount,
    type,
    category: category?.trim() || undefined,
    account: account?.trim() || undefined,
    notes: notes?.trim() || undefined,
    hash: hashRow(isoDate, clean, amount, type),
    issues: [],
  };
}

function parseLaunchTable(rows: string[][]): MappedRow[] {
  let headerAt = 0;
  let best = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const score = rows[i].filter((cell) => mapColumnHeader(cell)).length;
    if (score > best) {
      best = score;
      headerAt = i;
    }
  }
  if (best < 1) return [];
  const headers = rows[headerAt].map((h) => mapColumnHeader(h));
  const idx = (key: string) => headers.findIndex((h) => h === key);
  const dateIdx = idx("date");
  let descIdx = idx("description");
  const amountIdx = idx("amount");
  const debitIdx = idx("debit");
  const creditIdx = idx("credit");
  const categoryIdx = idx("category");
  if (descIdx < 0 && categoryIdx >= 0) descIdx = categoryIdx;
  if (descIdx < 0 || (amountIdx < 0 && debitIdx < 0 && creditIdx < 0)) return [];
  const out: MappedRow[] = [];
  for (const raw of rows.slice(headerAt + 1)) {
    const description = (raw[descIdx] ?? "").trim();
    const debit = debitIdx >= 0 ? parseMoneyToCents(raw[debitIdx] ?? "") : null;
    const credit = creditIdx >= 0 ? parseMoneyToCents(raw[creditIdx] ?? "") : null;
    let signed = amountIdx >= 0 ? parseMoneyToCents(raw[amountIdx] ?? "") : null;
    if (signed == null && (debit != null || credit != null)) signed = (credit ?? 0) - Math.abs(debit ?? 0);
    if (signed == null) continue;
    const date = dateIdx >= 0 ? parseDateCell(raw[dateIdx]) : null;
    const monthOnly = dateIdx >= 0 && !date ? monthKeyFromHeader(raw[dateIdx] ?? "", new Date().getFullYear()) : null;
    const iso = date ?? (monthOnly ? `${monthOnly}-01` : todayISO());
    const row = toLaunch(
      iso,
      description,
      signed,
      idx("type") >= 0 ? raw[idx("type")] ?? "" : "",
      categoryIdx >= 0 && categoryIdx !== descIdx ? raw[categoryIdx] : description,
      idx("account") >= 0 ? raw[idx("account")] : undefined,
      idx("notes") >= 0 ? raw[idx("notes")] : undefined,
    );
    if (row) out.push(row);
  }
  return out;
}

function parseBudgetGrid(rows: string[][], year: number): BudgetCell[] {
  let headerAt = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const months = rows[i].filter((cell) => monthKeyFromHeader(cell, year));
    if (months.length >= 2) {
      headerAt = i;
      break;
    }
  }
  if (headerAt < 0) return [];
  const header = rows[headerAt];
  const monthCols = header.map((cell, i) => ({ i, month: monthKeyFromHeader(cell, year) })).filter((c) => c.month);
  let catCol = header.findIndex((cell, i) => !monthKeyFromHeader(cell, year) && mapColumnHeader(cell) !== "amount");
  if (catCol < 0) catCol = 0;
  if (monthCols.some((c) => c.i === catCol)) {
    catCol = header.findIndex((_, i) => !monthCols.some((c) => c.i === i));
    if (catCol < 0) return [];
  }
  const out: BudgetCell[] = [];
  for (const raw of rows.slice(headerAt + 1)) {
    const category = (raw[catCol] ?? "").trim();
    if (!category || skipSummary(category) || monthKeyFromHeader(category, year)) continue;
    const type = incomeName(category) ? "INCOME" : "EXPENSE";
    for (const col of monthCols) {
      const cents = parseMoneyToCents(raw[col.i] ?? "");
      if (cents == null || cents === 0) continue;
      out.push({ month: col.month!, category, amount: Math.abs(cents), type });
    }
  }
  return out;
}

function parseBudgetTransposed(rows: string[][], year: number): BudgetCell[] {
  let firstMonthAt = -1;
  for (let i = 0; i < Math.min(rows.length, 40); i++) {
    const cell = rows[i][0] ?? "";
    if (monthKeyFromHeader(cell, year) && !/^\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}$/.test(cell.trim())) {
      firstMonthAt = i;
      break;
    }
  }
  if (firstMonthAt < 0) return [];
  const headerAt = firstMonthAt > 0 ? firstMonthAt - 1 : firstMonthAt;
  const start = monthKeyFromHeader(rows[headerAt][0] ?? "", year) ? headerAt : headerAt + 1;
  if (start >= rows.length) return [];
  const labels = (start > 0 ? rows[start - 1] : rows[0]).map((cell, i) => ({ i, name: (cell ?? "").trim() }));
  const categories = labels.filter(
    (c) => c.i > 0 && c.name && !monthKeyFromHeader(c.name, year) && !looksLikeMoney(c.name) && mapColumnHeader(c.name) !== "date",
  );
  if (categories.length < 1) return [];
  const out: BudgetCell[] = [];
  for (const raw of rows.slice(start)) {
    const month = monthKeyFromHeader(raw[0] ?? "", year);
    if (!month) continue;
    for (const cat of categories) {
      const cents = parseMoneyToCents(raw[cat.i] ?? "");
      if (cents == null || cents === 0) continue;
      out.push({
        month,
        category: cat.name,
        amount: Math.abs(cents),
        type: incomeName(cat.name) ? "INCOME" : "EXPENSE",
      });
    }
  }
  return out;
}

function looksLikeMoney(value: string) {
  if (!value.trim()) return false;
  if (parseDateCell(value) && /[\/\-.]/.test(value) && value.replace(/\d/g, "").length >= 2) return false;
  const cents = parseMoneyToCents(value);
  return cents != null;
}

function parseByShape(rows: string[][]): MappedRow[] {
  const filled = rows.filter((row) => row.filter((c) => String(c ?? "").trim()).length >= 2);
  if (filled.length < 1) return [];
  let start = 0;
  while (start < filled.length && filled[start].filter((c) => String(c ?? "").trim()).length <= 1) start += 1;
  const body = filled.slice(start);
  if (!body.length) return [];
  const headerHit = body[0].filter((cell) => mapColumnHeader(cell ?? "")).length;
  const sampleStart = headerHit >= 1 ? 1 : 0;
  const sample = body.slice(sampleStart, sampleStart + 40);
  if (!sample.length) return [];
  const width = Math.max(...body.map((r) => r.length));
  const scores = Array.from({ length: width }, (_, col) => {
    let dates = 0;
    let moneys = 0;
    let texts = 0;
    for (const row of sample) {
      const v = String(row[col] ?? "").trim();
      if (!v) continue;
      if (parseDateCell(v) || monthKeyFromHeader(v, new Date().getFullYear())) dates += 1;
      else if (looksLikeMoney(v)) moneys += 1;
      else texts += 1;
    }
    return { col, dates, moneys, texts };
  });
  const amountCol = [...scores].sort((a, b) => b.moneys - a.moneys)[0];
  if (!amountCol || amountCol.moneys < 1) return [];
  const dateCol = [...scores].filter((s) => s.col !== amountCol.col).sort((a, b) => b.dates - a.dates)[0];
  const descCol = [...scores]
    .filter((s) => s.col !== amountCol.col && (!dateCol || dateCol.dates < 1 || s.col !== dateCol.col))
    .sort((a, b) => b.texts - a.texts)[0];
  if (!descCol || descCol.texts < 1) return [];
  const useDate = dateCol && dateCol.dates >= 1 ? dateCol.col : -1;
  const out: MappedRow[] = [];
  for (const raw of body.slice(sampleStart)) {
    const description = String(raw[descCol.col] ?? "").trim();
    const signed = parseMoneyToCents(raw[amountCol.col] ?? "");
    if (signed == null) continue;
    const monthHint = useDate >= 0 ? monthKeyFromHeader(raw[useDate] ?? "", new Date().getFullYear()) : null;
    const date = useDate >= 0 ? parseDateCell(raw[useDate]) ?? (monthHint ? `${monthHint}-01` : null) : null;
    const row = toLaunch(date ?? todayISO(), description, signed, "", description);
    if (row) out.push(row);
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
  if (!tables.length) {
    return {
      error: filename.toLowerCase().endsWith(".xls")
        ? "Esse .xls antigo o app não lê. Salva de novo como Excel .xlsx ou CSV e manda outra vez."
        : "Planilha vazia.",
      filename,
      rows: [],
      budgets: [],
      months: [],
      categories: [],
      notes: [],
    };
  }
  const year = yearFromName(filename);
  const familyRows = parseFamilyControl(tables, filename);
  if (familyRows?.length) {
    const result = summarize(familyRows, []);
    result.filename = filename;
    result.notes = [
      "Li a planilha da casa: cada mês em uma aba, separado em cartão, contas fixas e o que varia.",
      ...explainOrganized(result),
      "O trabalho desta planilha é um só: ver se o mês fecha e ir baixando o cartão.",
    ];
    return result;
  }
  const rows: MappedRow[] = [];
  const budgets: BudgetCell[] = [];
  for (const table of tables) {
    const launches = parseLaunchTable(table.rows);
    const grid = parseBudgetGrid(table.rows, year);
    const transposed = grid.length ? [] : parseBudgetTransposed(table.rows, year);
    const budget = grid.length >= transposed.length ? grid : transposed;
    const found = launches.length ? launches : parseByShape(table.rows);
    if (budget.length >= 3 && found.length < 3) budgets.push(...budget);
    else if (found.length) rows.push(...found);
    else if (budget.length) budgets.push(...budget);
  }
  const result = summarize(rows, budgets);
  result.filename = filename;
  result.notes = explainOrganized(result);
  if (!result.rows.length && !result.budgets.length) {
    result.error =
      "Li o arquivo, mas não achei colunas de valor. Pode ser categoria + valor, data + descrição + valor, ou meses do ano na primeira linha. CSV também vale.";
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
