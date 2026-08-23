import { z } from "zod";
import { addAccount, archiveAccount, listBankLinks, pushAudit, requireSession, saveBankLinks } from "@/lib/store";
import { parseMoneyToCents } from "@/lib/money";
import { newId, nowIso } from "@/lib/types";
import type { AccountType } from "@/lib/types";

export type FormState = { error?: string; ok?: string } | null;

export async function createAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const parsed = z
    .object({
      name: z.string().trim().min(2, "Nome da conta"),
      type: z.enum(["CHECKING", "SAVINGS", "WALLET", "CASH", "CREDIT"]),
      initialBalance: z.string().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      type: formData.get("type"),
      initialBalance: formData.get("initialBalance"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const cents = parsed.data.initialBalance ? parseMoneyToCents(parsed.data.initialBalance) : 0;
  if (cents == null) return { error: "Saldo inicial inválido" };
  await addAccount({
    id: newId(),
    workspaceId: session.workspace.id,
    name: parsed.data.name,
    type: parsed.data.type as AccountType,
    initialBalance: cents,
    archived: false,
    createdAt: nowIso(),
  });
  await pushAudit(session.user.id, "create", "account", {
    workspaceId: session.workspace.id,
    detail: parsed.data.name,
  });
  return { ok: "Conta criada." };
}

export async function archiveAccountAction(accountId: string) {
  const session = await requireSession();
  if (!session) return;
  await archiveAccount(accountId, session.workspace.id);
}

export async function requestBankLinksAction(names: string[]) {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  if (session.workspace.type !== "PERSONAL") return { error: "Ligar banco da casa fica em Pessoa." };
  const clean = [...new Set(names.map((name) => name.trim()).filter((name) => name.length >= 2))];
  if (!clean.length) return { error: "Marca pelo menos um banco ou cartão." };
  const now = nowIso();
  const existing = listBankLinks(session.workspace.id);
  const next = clean.map((name) => {
    const found = existing.find((item) => item.name.toLowerCase() === name.toLowerCase());
    return found ?? { id: newId(), name, requestedAt: now };
  });
  await saveBankLinks(session.workspace.id, next);
  await pushAudit(session.user.id, "update", "account", {
    workspaceId: session.workspace.id,
    detail: `Pediu ligação: ${next.map((item) => item.name).join(", ")}`,
  });
  return { ok: "Pedido guardado. O gasto só entra sozinho depois que o banco autorizar no Open Finance. Sem senha aqui." };
}
