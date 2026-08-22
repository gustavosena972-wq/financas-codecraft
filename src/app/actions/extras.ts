import { z } from "zod";
import { addTransaction, listGoals, listHoldings, listRecurring, pushAudit, requireSession, saveGoals, saveHoldings, saveRecurring } from "@/lib/store";
import { monthKey, parseMoneyToCents } from "@/lib/money";
import { newId, nowIso } from "@/lib/types";
import { goalLimit, recurringLimit } from "@/lib/plans";

export type ExtraState = { error?: string; ok?: string } | null;

export async function createRecurringAction(_prev: ExtraState, formData: FormData): Promise<ExtraState> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const parsed = z
    .object({
      description: z.string().trim().min(2),
      amount: z.string().min(1),
      type: z.enum(["INCOME", "EXPENSE"]),
      day: z.string().min(1),
      accountId: z.string().min(1),
      categoryId: z.string().optional(),
    })
    .safeParse({
      description: formData.get("description"),
      amount: formData.get("amount"),
      type: formData.get("type"),
      day: formData.get("day"),
      accountId: formData.get("accountId"),
      categoryId: formData.get("categoryId") || undefined,
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const cents = parseMoneyToCents(parsed.data.amount);
  if (cents == null || cents === 0) return { error: "Valor inválido" };
  const day = Number(parsed.data.day);
  if (!Number.isInteger(day) || day < 1 || day > 28) return { error: "Use um dia entre 1 e 28." };
  const current = listRecurring(session.workspace.id);
  const limit = recurringLimit(session.user.plan);
  if (current.length >= limit) {
    return { error: `No Free cabem ${limit} recorrentes. Atualize o plano para cadastrar mais.` };
  }
  await saveRecurring(session.workspace.id, [
    ...current,
    {
      id: newId(),
      workspaceId: session.workspace.id,
      description: parsed.data.description,
      amount: Math.abs(cents),
      type: parsed.data.type,
      day,
      accountId: parsed.data.accountId,
      categoryId: parsed.data.categoryId || null,
    },
  ]);
  await pushAudit(session.user.id, "create", "recurring", {
    workspaceId: session.workspace.id,
    detail: parsed.data.description,
  });
  return { ok: "Recorrente salvo." };
}

export async function deleteRecurringAction(id: string) {
  const session = await requireSession();
  if (!session) return;
  await saveRecurring(
    session.workspace.id,
    listRecurring(session.workspace.id).filter((item) => item.id !== id),
  );
}

export async function postRecurringAction(id: string) {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const rec = listRecurring(session.workspace.id).find((item) => item.id === id);
  if (!rec) return { error: "Recorrente não encontrado." };
  const month = monthKey();
  const lastDay = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const day = Math.min(rec.day, lastDay);
  await addTransaction({
    id: newId(),
    workspaceId: session.workspace.id,
    accountId: rec.accountId,
    categoryId: rec.categoryId,
    type: rec.type,
    amount: rec.amount,
    date: `${month}-${String(day).padStart(2, "0")}T12:00:00`,
    description: rec.description,
    notes: "Lançado da agenda recorrente",
    transferToAccountId: null,
    importHash: null,
    createdAt: nowIso(),
  });
  await pushAudit(session.user.id, "create", "transaction", {
    workspaceId: session.workspace.id,
    detail: rec.description,
  });
  return { ok: "Lançamento criado." };
}

export async function createGoalAction(_prev: ExtraState, formData: FormData): Promise<ExtraState> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      target: z.string().min(1),
      deadline: z.string().min(7),
    })
    .safeParse({
      name: formData.get("name"),
      target: formData.get("target"),
      deadline: formData.get("deadline"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const cents = parseMoneyToCents(parsed.data.target);
  if (cents == null || cents <= 0) return { error: "Valor inválido" };
  const current = listGoals(session.workspace.id);
  const limit = goalLimit(session.user.plan);
  if (current.length >= limit) {
    return { error: `No Free cabe ${limit} meta. Atualize o plano para cadastrar mais.` };
  }
  await saveGoals(session.workspace.id, [
    ...current,
    {
      id: newId(),
      workspaceId: session.workspace.id,
      name: parsed.data.name,
      target: Math.abs(cents),
      deadline: parsed.data.deadline.slice(0, 10),
    },
  ]);
  await pushAudit(session.user.id, "create", "goal", {
    workspaceId: session.workspace.id,
    detail: parsed.data.name,
  });
  return { ok: "Meta salva." };
}

export async function deleteGoalAction(id: string) {
  const session = await requireSession();
  if (!session) return;
  await saveGoals(
    session.workspace.id,
    listGoals(session.workspace.id).filter((item) => item.id !== id),
  );
}

export async function createHoldingAction(_prev: ExtraState, formData: FormData): Promise<ExtraState> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      kind: z.enum(["STOCK", "FUND", "FIXED", "CRYPTO", "OTHER"]),
      value: z.string().min(1),
    })
    .safeParse({
      name: formData.get("name"),
      kind: formData.get("kind"),
      value: formData.get("value"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const cents = parseMoneyToCents(parsed.data.value);
  if (cents == null || cents < 0) return { error: "Valor inválido" };
  await saveHoldings(session.workspace.id, [
    ...listHoldings(session.workspace.id),
    {
      id: newId(),
      workspaceId: session.workspace.id,
      name: parsed.data.name,
      kind: parsed.data.kind,
      value: cents,
    },
  ]);
  return { ok: "Investimento salvo." };
}

export async function deleteHoldingAction(id: string) {
  const session = await requireSession();
  if (!session) return;
  await saveHoldings(
    session.workspace.id,
    listHoldings(session.workspace.id).filter((item) => item.id !== id),
  );
}
