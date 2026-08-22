import { addAccount, addCategory, addTransaction, deleteTransaction, listAccounts, listCategories, listTransactions, pushAudit, requireSession, upsertBudget } from "@/lib/store";
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
  const workspaceId = session.workspace.id;
  const userPlan = session.user.plan;
  const rows = JSON.parse(rowsJson) as MappedRow[];
  const valid = rows
    .filter((row) => row.amount > 0)
    .map((row) => {
      const today = new Date();
      const fallback = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
      return {
        ...row,
        date: row.date || fallback,
        issues: row.issues.filter((i) => i !== "Data inválida" && i !== "Possível duplicata"),
      };
    })
    .filter((row) => row.issues.length === 0);
  if (!valid.length) return { error: "Nenhuma linha com valor para importar. Precisa de descrição e um número." };
  let accounts = listAccounts(workspaceId);
  if (!accounts[0]) {
    await addAccount({
      id: newId(),
      workspaceId,
      name: "Carteira",
      type: "WALLET",
      initialBalance: 0,
      archived: false,
      createdAt: nowIso(),
    });
    accounts = listAccounts(workspaceId);
  }
  const defaultAccount = accounts[0];
  if (!defaultAccount) return { error: "Não consegui criar a conta para receber os lançamentos." };
  let categories = listCategories(workspaceId);
  const findAccount = (name?: string) =>
    (name && accounts.find((a) => a.name.toLowerCase() === name.toLowerCase())) || defaultAccount;
  async function ensureCategory(name?: string, type?: string, description?: string) {
    if (name) {
      const fromName = categories.find((c) => c.name.toLowerCase() === name.toLowerCase() && (!type || c.kind === type));
      if (fromName) return fromName;
      const created = {
        id: newId(),
        workspaceId,
        name: name.slice(0, 40),
        kind: type === "INCOME" ? "INCOME" : "EXPENSE",
        color: "#8C97A3",
      };
      await addCategory(created);
      categories = listCategories(workspaceId);
      return created;
    }
    if (planHasAi(userPlan) && description && (type === "INCOME" || type === "EXPENSE")) {
      return applyCategorySuggestion(description, type, name, categories);
    }
    return null;
  }
  let created = 0;
  const existing = new Set(listTransactions(workspaceId).map((t) => t.importHash).filter(Boolean));
  for (const row of valid) {
    if (existing.has(row.hash)) continue;
    await addTransaction({
      id: newId(),
      workspaceId,
      accountId: findAccount(row.account).id,
      categoryId: (await ensureCategory(row.category, row.type, row.description))?.id ?? null,
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
    workspaceId,
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
    const months = new Set(
      payload.rows
        .filter((row) => row.amount > 0 && row.date)
        .map((row) => row.date.slice(0, 7))
        .filter((month) => month && month !== "sem-da"),
    );
    if (session.workspace.type === "PERSONAL" && months.size >= 3) {
      for (const tx of listTransactions(session.workspace.id)) {
        if (months.has(tx.date.slice(0, 7))) {
          await deleteTransaction(tx.id, session.workspace.id);
        }
      }
    }
    const imported = await confirmImportAction(JSON.stringify(payload.rows));
    if ("error" in imported && imported.error && !payload.budgets?.length) return imported;
    created = imported.created ?? 0;
  }
  let categories = listCategories(session.workspace.id);
  for (const cell of payload.budgets ?? []) {
    if (cell.amount <= 0) continue;
    let category = categories.find((c) => c.name.toLowerCase() === cell.category.toLowerCase());
    if (!category) {
      const created = {
        id: newId(),
        workspaceId: session.workspace.id,
        name: cell.category.slice(0, 40),
        kind: cell.type === "INCOME" ? "INCOME" : "EXPENSE",
        color: "#8C97A3",
      };
      await addCategory(created);
      categories = listCategories(session.workspace.id);
      category = created;
    }
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
    return { error: "Não achei valor nessa planilha. Precisa de colunas de descrição e valor, ou um orçamento com meses." };
  }
  await pushAudit(session.user.id, "organize", "workbook", {
    workspaceId: session.workspace.id,
    detail: `${created} lançamentos, ${budgets} linhas de orçamento`,
  });
  return { ok: `${created} lançamento(s) e ${budgets} valor(es) de orçamento foram para o app.` };
}
