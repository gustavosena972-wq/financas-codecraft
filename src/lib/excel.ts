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

const HEADER_ALIASES: Record<string, string> = {
  data: "date",
  date: "date",
  vencimento: "date",
  descricao: "description",
  descrição: "description",
  historico: "description",
  histórico: "description",
  description: "description",
  memo: "description",
  valor: "amount",
  value: "amount",
  amount: "amount",
  tipo: "type",
  type: "type",
  categoria: "category",
  category: "category",
  conta: "account",
  account: "account",
  carteira: "account",
  observacoes: "notes",
  observações: "notes",
  notes: "notes",
};

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function excelSerialToISO(serial: number) {
  const utc = new Date(Math.round((serial - 25569) * 86400 * 1000));
  const y = utc.getUTCFullYear();
  const m = String(utc.getUTCMonth() + 1).padStart(2, "0");
  const d = String(utc.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function cellToString(value: unknown): string {
  if (value == null || value === "") return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "object" && value && "text" in (value as object)) {
    return String((value as { text: string }).text);
  }
  if (typeof value === "object" && value && "result" in (value as object)) {
    return cellToString((value as { result: unknown }).result);
  }
  return String(value).trim();
}

function parseDateCell(raw: unknown): string | null {
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

function inferType(raw: string, amount: number): "INCOME" | "EXPENSE" {
  const t = normalizeHeader(raw);
  if (["receita", "entrada", "income", "credito", "crédito", "c"].includes(t)) return "INCOME";
  if (["despesa", "saida", "saída", "expense", "debito", "débito", "d"].includes(t)) {
    return "EXPENSE";
  }
  return amount < 0 ? "EXPENSE" : "INCOME";
}

function hashRow(date: string, description: string, amount: number, type: string) {
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
  const mappedHeaders = headers.map((h) => HEADER_ALIASES[normalizeHeader(h)] ?? null);
  const idx = (key: string) => mappedHeaders.findIndex((h) => h === key);

  const dateIdx = idx("date");
  const descIdx = idx("description");
  const amountIdx = idx("amount");
  if (dateIdx < 0 || descIdx < 0 || amountIdx < 0) {
    return {
      error:
        "Não foi possível mapear as colunas. Use ao menos: Data, Descrição e Valor. Baixe o modelo padrão se precisar.",
      rows: [] as MappedRow[],
      headers,
    };
  }

  const mapped: MappedRow[] = [];
  for (const raw of rows.slice(1)) {
    const issues: string[] = [];
    const date = parseDateCell(raw[dateIdx]);
    if (!date) issues.push("Data inválida");
    const description = (raw[descIdx] ?? "").trim();
    if (!description) issues.push("Descrição vazia");
    const amountRaw = parseMoneyToCents(raw[amountIdx] ?? "");
    if (amountRaw == null) issues.push("Valor inválido");
    const typeCol = idx("type") >= 0 ? raw[idx("type")] : "";
    const signed = amountRaw ?? 0;
    const type = inferType(typeCol, signed);
    const amount = Math.abs(signed);
    const category = idx("category") >= 0 ? raw[idx("category")] : "";
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

function splitCsv(line: string, delimiter: string) {
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
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Lancamentos");
  sheet.columns = [
    { header: "Data", key: "date", width: 14 },
    { header: "Descrição", key: "description", width: 36 },
    { header: "Valor", key: "amount", width: 14 },
    { header: "Tipo", key: "type", width: 12 },
    { header: "Categoria", key: "category", width: 18 },
    { header: "Conta", key: "account", width: 18 },
    { header: "Observações", key: "notes", width: 28 },
  ];
  sheet.addRow({
    date: "2026-08-01",
    description: "Salário",
    amount: 8500,
    type: "Receita",
    category: "Salário",
    account: "Conta corrente",
    notes: "",
  });
  sheet.addRow({
    date: "2026-08-03",
    description: "Supermercado",
    amount: 420.5,
    type: "Despesa",
    category: "Alimentação",
    account: "Carteira",
    notes: "",
  });
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
