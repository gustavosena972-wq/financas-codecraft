import { z } from "zod";
import {
  addTransaction,
  listAccounts,
  listBills,
  listCostCenters,
  listLockedMonths,
  listParties,
  listReconciledIds,
  listTeam,
  pushAudit,
  requireSession,
  saveBills,
  saveCostCenters,
  saveLockedMonths,
  saveParties,
  saveReconciledIds,
  saveTeam,
} from "@/lib/store";
import { monthKey, parseMoneyToCents } from "@/lib/money";
import { planHasClose, planHasOps, teamLimit } from "@/lib/plans";
import { newId, nowIso } from "@/lib/types";

export type OpsState = { error?: string; ok?: string } | null;

async function needOps() {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." as const, session: null };
  if (!planHasOps(session.user.plan)) return { error: "Isso entra no Pro." as const, session: null };
  return { error: null, session };
}

export async function createCostCenterAction(_prev: OpsState, formData: FormData): Promise<OpsState> {
  const gate = await needOps();
  if (!gate.session) return { error: gate.error ?? "Sessão expirada." };
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Nome curto demais." };
  const current = listCostCenters(gate.session.workspace.id);
  await saveCostCenters(gate.session.workspace.id, [
    ...current,
    { id: newId(), workspaceId: gate.session.workspace.id, name },
  ]);
  await pushAudit(gate.session.user.id, "create", "cost_center", { workspaceId: gate.session.workspace.id, detail: name });
  return { ok: "Centro de custo salvo." };
}

export async function deleteCostCenterAction(id: string) {
  const gate = await needOps();
  if (!gate.session) return;
  await saveCostCenters(
    gate.session.workspace.id,
    listCostCenters(gate.session.workspace.id).filter((item) => item.id !== id),
  );
}

export async function createPartyAction(_prev: OpsState, formData: FormData): Promise<OpsState> {
  const gate = await needOps();
  if (!gate.session) return { error: gate.error ?? "Sessão expirada." };
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      kind: z.enum(["CUSTOMER", "SUPPLIER"]),
      document: z.string().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      kind: formData.get("kind"),
      document: String(formData.get("document") ?? "").trim() || undefined,
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  await saveParties(gate.session.workspace.id, [
    ...listParties(gate.session.workspace.id),
    {
      id: newId(),
      workspaceId: gate.session.workspace.id,
      name: parsed.data.name,
      kind: parsed.data.kind,
      document: parsed.data.document,
    },
  ]);
  await pushAudit(gate.session.user.id, "create", "party", {
    workspaceId: gate.session.workspace.id,
    detail: parsed.data.name,
  });
  return { ok: "Parceiro salvo." };
}

export async function deletePartyAction(id: string) {
  const gate = await needOps();
  if (!gate.session) return;
  await saveParties(
    gate.session.workspace.id,
    listParties(gate.session.workspace.id).filter((item) => item.id !== id),
  );
}

export async function createBillAction(_prev: OpsState, formData: FormData): Promise<OpsState> {
  const gate = await needOps();
  if (!gate.session) return { error: gate.error ?? "Sessão expirada." };
  const parsed = z
    .object({
      kind: z.enum(["PAYABLE", "RECEIVABLE"]),
      partyName: z.string().trim().min(2),
      description: z.string().trim().min(2),
      amount: z.string().min(1),
      due: z.string().min(8),
      costCenterId: z.string().optional(),
    })
    .safeParse({
      kind: formData.get("kind"),
      partyName: formData.get("partyName"),
      description: formData.get("description"),
      amount: formData.get("amount"),
      due: formData.get("due"),
      costCenterId: formData.get("costCenterId") || undefined,
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const cents = parseMoneyToCents(parsed.data.amount);
  if (cents == null || cents === 0) return { error: "Valor inválido" };
  await saveBills(gate.session.workspace.id, [
    ...listBills(gate.session.workspace.id),
    {
      id: newId(),
      workspaceId: gate.session.workspace.id,
      kind: parsed.data.kind,
      partyName: parsed.data.partyName,
      description: parsed.data.description,
      amount: Math.abs(cents),
      due: parsed.data.due.slice(0, 10),
      status: "OPEN",
      costCenterId: parsed.data.costCenterId || null,
    },
  ]);
  await pushAudit(gate.session.user.id, "create", "bill", {
    workspaceId: gate.session.workspace.id,
    detail: parsed.data.description,
  });
  return { ok: "Título lançado." };
}

export async function settleBillAction(id: string, accountId: string) {
  const gate = await needOps();
  if (!gate.session) return { error: gate.error ?? "Sessão expirada." };
  const bills = listBills(gate.session.workspace.id);
  const bill = bills.find((item) => item.id === id);
  if (!bill || bill.status === "PAID") return { error: "Título não encontrado." };
  const account = listAccounts(gate.session.workspace.id).find((item) => item.id === accountId);
  if (!account) return { error: "Escolha a conta." };
  const txId = newId();
  await addTransaction({
    id: txId,
    workspaceId: gate.session.workspace.id,
    accountId: account.id,
    categoryId: null,
    type: bill.kind === "RECEIVABLE" ? "INCOME" : "EXPENSE",
    amount: bill.amount,
    date: `${nowIso().slice(0, 10)}T12:00:00`,
    description: bill.description,
    notes: `Baixa de título · ${bill.partyName}`,
    transferToAccountId: null,
    importHash: null,
    createdAt: nowIso(),
  });
  await saveBills(
    gate.session.workspace.id,
    bills.map((item) =>
      item.id === id ? { ...item, status: "PAID", paidAt: nowIso(), paidTxId: txId } : item,
    ),
  );
  await pushAudit(gate.session.user.id, "settle", "bill", {
    workspaceId: gate.session.workspace.id,
    detail: bill.description,
  });
  return { ok: "Título baixado e lançado no caixa." };
}

export async function deleteBillAction(id: string) {
  const gate = await needOps();
  if (!gate.session) return;
  await saveBills(
    gate.session.workspace.id,
    listBills(gate.session.workspace.id).filter((item) => item.id !== id),
  );
}

export async function toggleReconciledAction(txId: string) {
  const gate = await needOps();
  if (!gate.session) return;
  const current = listReconciledIds(gate.session.workspace.id);
  const next = current.includes(txId) ? current.filter((id) => id !== txId) : [...current, txId];
  await saveReconciledIds(gate.session.workspace.id, next);
}

export async function toggleMonthLockAction(month?: string) {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  if (!planHasClose(session.user.plan)) return { error: "Fechamento de mês entra no Enterprise." };
  const key = month ?? monthKey();
  const current = listLockedMonths(session.workspace.id);
  const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
  await saveLockedMonths(session.workspace.id, next);
  await pushAudit(session.user.id, next.includes(key) ? "lock" : "unlock", "month", {
    workspaceId: session.workspace.id,
    detail: key,
  });
  return { ok: next.includes(key) ? "Mês fechado." : "Mês reaberto." };
}

export async function createSeatAction(_prev: OpsState, formData: FormData): Promise<OpsState> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const limit = teamLimit(session.user.plan);
  if (limit === 0) return { error: "Equipe entra no Pro." };
  const parsed = z
    .object({
      name: z.string().trim().min(2),
      email: z.string().trim().email("E-mail inválido"),
      role: z.enum(["ADMIN", "FINANCE", "VIEW"]),
    })
    .safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const current = listTeam(session.workspace.id);
  if (current.length >= limit) return { error: `Neste plano cabem ${limit} assentos.` };
  await saveTeam(session.workspace.id, [
    ...current,
    { id: newId(), name: parsed.data.name, email: parsed.data.email, role: parsed.data.role },
  ]);
  await pushAudit(session.user.id, "create", "seat", {
    workspaceId: session.workspace.id,
    detail: parsed.data.email,
  });
  return { ok: "Assento registrado. O acesso de login combinamos no WhatsApp no Enterprise." };
}

export async function deleteSeatAction(id: string) {
  const session = await requireSession();
  if (!session) return;
  await saveTeam(
    session.workspace.id,
    listTeam(session.workspace.id).filter((item) => item.id !== id),
  );
}
