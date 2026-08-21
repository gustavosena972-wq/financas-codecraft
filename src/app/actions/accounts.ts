import { z } from "zod";
import { addAccount, archiveAccount, pushAudit, requireSession } from "@/lib/store";
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
