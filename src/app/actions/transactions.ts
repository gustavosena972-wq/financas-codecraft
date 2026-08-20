import { z } from "zod";
import { addTransaction, deleteTransaction, loadDb, pushAudit, requireSession, saveDb } from "@/lib/store";
import { parseMoneyToCents } from "@/lib/money";
import { newId, nowIso } from "@/lib/types";
import type { TransactionType } from "@/lib/types";

export type TxState = { error?: string; ok?: string } | null;

export async function createTransactionAction(_prev: TxState, formData: FormData): Promise<TxState> {
  const session = requireSession();
  if (!session) return { error: "Sessão expirada." };
  const parsed = z
    .object({
      type: z.enum(["INCOME", "EXPENSE", "TRANSFER"]),
      amount: z.string().min(1),
      date: z.string().min(8),
      description: z.string().trim().min(2, "Descreva o lançamento"),
      accountId: z.string().min(1),
      categoryId: z.string().optional(),
      transferToAccountId: z.string().optional(),
      notes: z.string().optional(),
    })
    .safeParse({
      type: formData.get("type"),
      amount: formData.get("amount"),
      date: formData.get("date"),
      description: formData.get("description"),
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId") || undefined,
      transferToAccountId: formData.get("transferToAccountId") || undefined,
      notes: formData.get("notes") || undefined,
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const cents = parseMoneyToCents(parsed.data.amount);
  if (cents == null || cents === 0) return { error: "Valor inválido" };
  if (parsed.data.type === "TRANSFER" && !parsed.data.transferToAccountId) {
    return { error: "Escolha a conta de destino." };
  }
  addTransaction({
    id: newId(),
    workspaceId: session.workspace.id,
    accountId: parsed.data.accountId,
    categoryId: parsed.data.type === "TRANSFER" ? null : parsed.data.categoryId || null,
    type: parsed.data.type as TransactionType,
    amount: Math.abs(cents),
    date: `${parsed.data.date}T12:00:00`,
    description: parsed.data.description,
    notes: parsed.data.notes,
    transferToAccountId: parsed.data.type === "TRANSFER" ? parsed.data.transferToAccountId || null : null,
    importHash: null,
    createdAt: nowIso(),
  });
  const db = loadDb();
  pushAudit(db, session.user.id, "create", "transaction", {
    workspaceId: session.workspace.id,
    detail: parsed.data.description,
  });
  saveDb(db);
  return { ok: "Lançamento salvo." };
}

export async function deleteTransactionAction(id: string) {
  const session = requireSession();
  if (!session) return;
  deleteTransaction(id, session.workspace.id);
}
