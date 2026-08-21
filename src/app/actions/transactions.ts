import { z } from "zod";
import { addTransaction, deleteTransaction, isMonthLocked, listTransactions, pushAudit, requireSession } from "@/lib/store";
import { parseMoneyToCents, toInputDate } from "@/lib/money";
import { newId, nowIso } from "@/lib/types";
import type { TransactionType } from "@/lib/types";

export type TxState = { error?: string; ok?: string } | null;

export async function createTransactionAction(_prev: TxState, formData: FormData): Promise<TxState> {
  const session = await requireSession();
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
  if (isMonthLocked(session.workspace.id, parsed.data.date)) {
    return { error: "Este mês está fechado. No Enterprise, reabra o mês para lançar." };
  }
  await addTransaction({
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
  await pushAudit(session.user.id, "create", "transaction", {
    workspaceId: session.workspace.id,
    detail: parsed.data.description,
  });
  return { ok: "Lançamento salvo." };
}

export async function deleteTransactionAction(id: string) {
  const session = await requireSession();
  if (!session) return;
  const tx = listTransactions(session.workspace.id).find((item) => item.id === id);
  if (tx && isMonthLocked(session.workspace.id, tx.date)) return;
  await deleteTransaction(id, session.workspace.id);
}

export async function duplicateTransactionAction(id: string) {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const tx = listTransactions(session.workspace.id).find((item) => item.id === id);
  if (!tx) return { error: "Lançamento não encontrado." };
  if (isMonthLocked(session.workspace.id, toInputDate(new Date()))) {
    return { error: "Este mês está fechado." };
  }
  await addTransaction({
    ...tx,
    id: newId(),
    date: `${toInputDate(new Date())}T12:00:00`,
    createdAt: nowIso(),
    importHash: null,
    description: `${tx.description} (cópia)`,
  });
  await pushAudit(session.user.id, "create", "transaction", {
    workspaceId: session.workspace.id,
    detail: `${tx.description} (cópia)`,
  });
  return { ok: "Cópia lançada hoje." };
}
