import { addTransaction, listAccounts, listCategories, listTransactions, pushAudit, requireSession, upsertBudget } from "@/lib/store";
import { parseWorkbook, type MappedRow } from "@/lib/excel";
import { newId, nowIso } from "@/lib/types";
import { applyCategorySuggestion } from "@/lib/ai";
import { planHasAi } from "@/lib/plans";
import type { OrganizeResult } from "@/lib/organize";

export type ImportPreview = {
  error?: string;
  headers?: string[];
  rows?: MappedRow[];
  duplicates?: number;
};

export async function previewImportAction(formData: FormData): Promise<ImportPreview> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo Excel ou CSV." };
  }
  const parsed = await parseWorkbook(await file.arrayBuffer(), file.name);
  if (parsed.error) return { error: parsed.error, headers: parsed.headers };
  const existing = new Set(
    listTransactions(session.workspace.id)
      .map((t) => t.importHash)
      .filter(Boolean),
  );
  const rows = parsed.rows.map((row) =>
    existing.has(row.hash) ? { ...row, issues: [...row.issues, "Possível duplicata"] } : row,
  );
  return {
    headers: parsed.headers,
    rows,
    duplicates: rows.filter((r) => r.issues.includes("Possível duplicata")).length,
  };
}

export async function confirmImportAction(rowsJson: string) {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const rows = JSON.parse(rowsJson) as MappedRow[];
  const valid = rows.filter((row) => row.issues.length === 0 && row.amount > 0 && row.date);
  if (!valid.length) return { error: "Nenhuma linha válida para importar." };
  const accounts = listAccounts(session.workspace.id);
  const categories = listCategories(session.workspace.id);
  const defaultAccount = accounts[0];
  if (!defaultAccount) return { error: "Crie ao menos uma conta antes de importar." };
  const findAccount = (name?: string) =>
    (name && accounts.find((a) => a.name.toLowerCase() === name.toLowerCase())) || defaultAccount;
  const findCategory = (name?: string, type?: string, description?: string) => {
    const fromName = name
      ? categories.find((c) => c.name.toLowerCase() === name.toLowerCase() && (!type || c.kind === type))
      : null;
    if (fromName) return fromName;
    if (planHasAi(session.user.plan) && description && (type === "INCOME" || type === "EXPENSE")) {
      return applyCategorySuggestion(description, type, name, categories);
    }
    return null;
  };
  let created = 0;
  const existing = new Set(listTransactions(session.workspace.id).map((t) => t.importHash).filter(Boolean));
  for (const row of valid) {
    if (existing.has(row.hash)) continue;
    await addTransaction({
      id: newId(),
      workspaceId: session.workspace.id,
      accountId: findAccount(row.account).id,
      categoryId: findCategory(row.category, row.type, row.description)?.id ?? null,
      type: row.type,
      amount: row.amount,
      date: `${row.date}T12:00:00`,
      description: row.description,
      notes: row.notes,
      transferToAccountId: null,
      importHash: row.hash,
      createdAt: nowIso(),
    });
    existing.add(row.hash);
    created += 1;
  }
  await pushAudit(session.user.id, "import", "transaction", {
    workspaceId: session.workspace.id,
    detail: `${created} lançamentos`,
  });
  return { ok: `${created} lançamentos importados.`, created };
}

export async function applyOrganizeAction(payloadJson: string) {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const payload = JSON.parse(payloadJson) as OrganizeResult;
  let created = 0;
  let budgets = 0;
  if (payload.rows?.length) {
    const imported = await confirmImportAction(JSON.stringify(payload.rows));
    if ("error" in imported && imported.error && !payload.budgets?.length) return imported;
    created = imported.created ?? 0;
  }
  const categories = listCategories(session.workspace.id);
  for (const cell of payload.budgets ?? []) {
    const category = categories.find((c) => c.name.toLowerCase() === cell.category.toLowerCase());
    if (!category || cell.amount <= 0) continue;
    await upsertBudget({
      id: newId(),
      workspaceId: session.workspace.id,
      categoryId: category.id,
      month: cell.month,
      amount: cell.amount,
    });
    budgets += 1;
  }
  if (!created && !budgets) {
    return { error: "Nada para mandar ao app. Confira se as categorias da planilha existem aqui, ou se há lançamentos com data." };
  }
  await pushAudit(session.user.id, "organize", "workbook", {
    workspaceId: session.workspace.id,
    detail: `${created} lançamentos, ${budgets} linhas de orçamento`,
  });
  return { ok: `${created} lançamento(s) e ${budgets} valor(es) de orçamento foram para o app.` };
}
