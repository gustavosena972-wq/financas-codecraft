import ExcelJS from "exceljs";
import { parseMoneyToCents } from "./money";

export type MappedRow = {
  date: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  category?: string;
  account?: string;
  notes?: string;
  hash: string;
  issues: string[];
};

export function normalizeHeader(value: string) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, " ")
    .replace(/[^a-z0-9$]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function mapColumnHeader(raw: string): string | null {
  const n = normalizeHeader(raw);
  if (!n) return null;
  const compact = n.replace(/ /g, "").replace(/\$/g, "");
  const exact: Record<string, string> = {
    data: "date",
    date: "date",
    vencimento: "date",
    dia: "date",
    dt: "date",
    mes: "date",
    competencia: "date",
    descricao: "description",
    historico: "description",
    description: "description",
    memo: "description",
    item: "description",
    lancamento: "description",
    nome: "description",
    title: "description",
    titulo: "description",
    detalhe: "description",
    detalhes: "description",
    transacao: "description",
    movimento: "description",
    estabelecimento: "description",
    favorecido: "description",
    beneficiario: "description",
    gasto: "description",
    gastos: "description",
    despesa: "description",
    despesas: "description",
    valor: "amount",
    value: "amount",
    amount: "amount",
    previsto: "amount",
    orcado: "amount",
    planejado: "amount",
    realizado: "amount",
    preco: "amount",
    total: "amount",
    vlr: "amount",
    rs: "amount",
    r: "amount",
    quanto: "amount",
    tipo: "type",
    type: "type",
    categoria: "category",
    category: "category",
    grupo: "category",
    classe: "category",
    conta: "account",
    account: "account",
    carteira: "account",
    banco: "account",
    observacoes: "notes",
    notes: "notes",
    saida: "debit",
    saidas: "debit",
    debito: "debit",
    debitos: "debit",
    entrada: "credit",
    entradas: "credit",
    credito: "credit",
    creditos: "credit",
  };
  if (exact[n] || exact[compact]) return exact[n] ?? exact[compact];
  if (compact.startsWith("data") || compact.startsWith("date") || compact.includes("venciment") || compact.includes("competenc")) {
    return "date";
  }
  if (compact === "saldo" || compact.startsWith("saldo") || compact.includes("quantidade") || compact === "qtd" || compact === "qtde") {
    return null;
  }
  if (
    compact.includes("historico") ||
    compact.includes("descricao") ||
    compact.includes("transacao") ||
    compact.includes("lancamento") ||
    compact.includes("movimento") ||
    compact.includes("estabelec") ||
    compact === "title"
  ) {
    return "description";
  }
  if (compact.includes("debito")) return "debit";
  if (compact.includes("credito")) return "credit";
  if (compact.includes("valor") || compact.includes("amount") || compact.includes("preco") || compact.startsWith("vlr")) {
    return "amount";
  }
  if (compact.includes("categoria") || compact.includes("category")) return "category";
  if (compact.includes("observac")) return "notes";
  return null;
}

function excelSerialToISO(serial: number) {
  const utc = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function dateToLocalISO(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return dateToLocalISO(value);
  if (typeof value === "object" && value) {
    const v = value as { richText?: { text?: string }[]; text?: string; result?: unknown };
    if (Array.isArray(v.richText)) return v.richText.map((part) => part.text ?? "").join("").trim();
    if (v.result != null) return cellToString(v.result);
    if (v.text != null && String(v.text).trim()) return String(v.text).trim();
  }
  return String(value).trim();
}

export function parseDateCell(raw: unknown): string | null {
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const text = cellToString(raw);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const br = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
  if (br) {
    const day = br[1].padStart(2, "0");
    const month = br[2].padStart(2, "0");
    const year = br[3].length === 2 ? `20${br[3]}` : br[3];
    return `${year}-${month}-${day}`;
  }
  const asNumber = Number(text);
  if (Number.isFinite(asNumber) && asNumber > 20000 && asNumber < 80000) {
    return excelSerialToISO(asNumber);
  }
  return null;
}

export function inferType(raw: string, amount: number): "INCOME" | "EXPENSE" {
  const t = normalizeHeader(raw);
  if (["receita", "entrada", "income", "credito", "crédito", "c"].includes(t)) return "INCOME";
  if (["despesa", "saida", "saída", "expense", "debito", "débito", "d"].includes(t)) {
    return "EXPENSE";
  }
  return amount < 0 ? "EXPENSE" : "INCOME";
}

export function hashRow(date: string, description: string, amount: number, type: string) {
  const s = `${date}|${description.toLowerCase()}|${Math.abs(amount)}|${type}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return `h${Math.abs(h).toString(16)}${s.length.toString(16)}`;
}

export async function parseWorkbook(buffer: ArrayBuffer, filename: string) {
  const rows: string[][] = [];
  const lower = filename.toLowerCase();

  if (lower.endsWith(".csv") || lower.endsWith(".txt")) {
    const text = new TextDecoder("utf-8").decode(buffer);
    const lines = text.split(/\r?\n/).filter((line) => line.trim().length);
    const delimiter = lines[0]?.includes(";") && !lines[0].includes(",") ? ";" : ",";
    for (const line of lines) {
      rows.push(splitCsv(line, delimiter));
    }
  } else {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { error: "Planilha vazia.", rows: [] as MappedRow[], headers: [] as string[] };
    sheet.eachRow((row) => {
      const values = (row.values as unknown[]).slice(1).map(cellToString);
      if (values.some((v) => v)) rows.push(values);
    });
  }

  if (rows.length < 2) {
    return { error: "Não há linhas suficientes. Inclua cabeçalho e ao menos um lançamento.", rows: [] as MappedRow[], headers: [] as string[] };
  }

  const headers = rows[0].map((h) => h.trim());
  const mappedHeaders = headers.map((h) => mapColumnHeader(h));
  const idx = (key: string) => mappedHeaders.findIndex((h) => h === key);

  const dateIdx = idx("date");
  let descIdx = idx("description");
  const amountIdx = idx("amount");
  const debitIdx = idx("debit");
  const creditIdx = idx("credit");
  const categoryIdx = idx("category");
  if (descIdx < 0 && categoryIdx >= 0) descIdx = categoryIdx;
  if (descIdx < 0 || (amountIdx < 0 && debitIdx < 0 && creditIdx < 0)) {
    return {
      error:
        "Não foi possível mapear as colunas. Use ao menos descrição (ou categoria) e valor. Data é opcional.",
      rows: [] as MappedRow[],
      headers,
    };
  }

  const mapped: MappedRow[] = [];
  for (const raw of rows.slice(1)) {
    const issues: string[] = [];
    const date = dateIdx >= 0 ? parseDateCell(raw[dateIdx]) : null;
    if (dateIdx >= 0 && !date) issues.push("Data inválida");
    const description = (raw[descIdx] ?? "").trim();
    if (!description) issues.push("Descrição vazia");
    const debit = debitIdx >= 0 ? parseMoneyToCents(raw[debitIdx] ?? "") : null;
    const credit = creditIdx >= 0 ? parseMoneyToCents(raw[creditIdx] ?? "") : null;
    let signed = amountIdx >= 0 ? parseMoneyToCents(raw[amountIdx] ?? "") : null;
    if (signed == null && (debit != null || credit != null)) {
      signed = (credit ?? 0) - (debit ?? 0);
    }
    if (signed == null) issues.push("Valor inválido");
    const typeCol = idx("type") >= 0 ? raw[idx("type")] : "";
    const amountSigned = signed ?? 0;
    const type = inferType(typeCol, amountSigned);
    const amount = Math.abs(amountSigned);
    const category = categoryIdx >= 0 ? raw[categoryIdx] : "";
    const account = idx("account") >= 0 ? raw[idx("account")] : "";
    const notes = idx("notes") >= 0 ? raw[idx("notes")] : "";
    const isoDate = date ?? "";
    mapped.push({
      date: isoDate,
      description,
      amount,
      type,
      category: category || undefined,
      account: account || undefined,
      notes: notes || undefined,
      hash: hashRow(isoDate, description, amount, type),
      issues,
    });
  }

  return { error: null as string | null, rows: mapped, headers };
}

export function splitCsv(line: string, delimiter: string) {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === delimiter && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  out.push(current.trim());
  return out;
}

export async function buildTemplateBuffer() {
  return buildSheetBuffer("Lancamentos", [
    ["2026-08-01", "Salário", 8500, "Receita", "Salário", "Conta corrente", ""],
    ["2026-08-03", "Supermercado", 420.5, "Despesa", "Alimentação", "Carteira", ""],
  ]);
}

export async function buildPersonalSampleBuffer() {
  return buildSheetBuffer("Pessoal", [
    ["2026-08-01", "Salário", 6200, "Receita", "Salário", "Conta corrente", ""],
    ["2026-08-02", "Aluguel", 1800, "Despesa", "Moradia", "Conta corrente", ""],
    ["2026-08-03", "Supermercado", 387.9, "Despesa", "Alimentação", "Carteira", ""],
    ["2026-08-05", "Combustível", 220, "Despesa", "Transporte", "Cartão", ""],
    ["2026-08-08", "Freelance site", 1500, "Receita", "Freelance", "Conta corrente", ""],
    ["2026-08-10", "Farmácia", 64.5, "Despesa", "Saúde", "Carteira", ""],
    ["2026-08-12", "Internet", 119.9, "Despesa", "Assinaturas", "Conta corrente", ""],
    ["2026-08-15", "Lanche", 32, "Despesa", "Alimentação", "Carteira", ""],
  ]);
}

export async function buildBusinessSampleBuffer() {
  return buildSheetBuffer("Empresa", [
    ["2026-08-01", "Cliente site institucional", 2800, "Receita", "Serviços", "Conta PJ", ""],
    ["2026-08-04", "Domínio e hospedagem", 89.9, "Despesa", "Infra", "Conta PJ", ""],
    ["2026-08-06", "Cliente loja", 4500, "Receita", "Serviços", "Conta PJ", ""],
    ["2026-08-07", "Imposto DAS", 210.4, "Despesa", "Impostos", "Conta PJ", ""],
    ["2026-08-09", "Canva Pro", 55, "Despesa", "Ferramentas", "Cartão PJ", ""],
    ["2026-08-14", "Freelancer texto", 400, "Despesa", "Terceiros", "Conta PJ", ""],
    ["2026-08-18", "Manutenção site", 900, "Receita", "Serviços", "Conta PJ", ""],
  ]);
}

export async function buildYearBudgetSampleBuffer() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Orcamento 2026");
  sheet.addRow(["Orçamento do ano — exemplo bagunçado"]);
  sheet.addRow([]);
  sheet.addRow(["Categoria", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"]);
  sheet.addRow(["Salário", 6200, 6200, 6200, 6200, 6200, 6200, 6200, 6200, 6200, 6200, 6200, 6200]);
  sheet.addRow(["Aluguel", 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800, 1800]);
  sheet.addRow(["Alimentação", 900, 900, 950, 900, 900, 1000, 900, 900, 900, 1100, 1200, 900]);
  sheet.addRow(["Internet", 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120]);
  sheet.addRow(["Transporte", 350, 350, 350, 350, 400, 350, 350, 350, 350, 350, 400, 350]);
  sheet.getRow(3).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

async function buildSheetBuffer(
  sheetName: string,
  rows: Array<[string, string, number, string, string, string, string]>,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);
  sheet.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Descrição", key: "description", width: 36 },
    { header: "Valor", key: "amount", width: 14 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Conta", key: "account", width: 18 },
    { header: "Observações", key: "notes", width: 28 },
  ];
  for (const [date, description, amount, type, category, account, notes] of rows) {
    sheet.addRow({ date, description, amount, type, category, account, notes });
  }
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}

export async function buildExportBuffer(
  rows: Array<{
    date: Date;
    description: string;
    amount: number;
    type: string;
    category?: string | null;
    account: string;
    notes?: string | null;
  }>,
) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Relatorio");
  sheet.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Descrição", key: "description", width: 36 },
    { header: "Valor", key: "amount", width: 14 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Conta", key: "account", width: 18 },
    { header: "Observações", key: "notes", width: 28 },
  ];
  for (const row of rows) {
    sheet.addRow({
      date: row.date.toISOString().slice(0, 10),
      description: row.description,
      amount: row.amount / 100,
      type: row.type === "INCOME" ? "Receita" : row.type === "EXPENSE" ? "Despesa" : "Transferência",
      category: row.category ?? "",
      account: row.account,
      notes: row.notes ?? "",
    });
  }
  sheet.getRow(1).font = { bold: true };
  return workbook.xlsx.writeBuffer();
}
