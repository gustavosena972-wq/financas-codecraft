"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { AccountType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requireWorkspace } from "@/lib/auth";
import { parseMoneyToCents } from "@/lib/money";

const accountSchema = z.object({
  name: z.string().trim().min(2, "Nome da conta"),
  type: z.nativeEnum(AccountType),
  initialBalance: z.string().optional(),
});

export type FormState = { error?: string; ok?: string } | null;

export async function createAccountAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, workspace } = await requireWorkspace();
  const parsed = accountSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    initialBalance: formData.get("initialBalance"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const cents = parsed.data.initialBalance
    ? parseMoneyToCents(parsed.data.initialBalance)
    : 0;
  if (cents == null) return { error: "Saldo inicial inválido" };

  const account = await prisma.account.create({
    data: {
      workspaceId: workspace.id,
      name: parsed.data.name,
      type: parsed.data.type,
      initialBalance: cents,
    },
  });
  await audit(user.id, "create", "account", {
    workspaceId: workspace.id,
    entityId: account.id,
    detail: account.name,
  });
  revalidatePath("/app/contas");
  revalidatePath("/app");
  return { ok: "Conta criada." };
}

export async function archiveAccountAction(accountId: string) {
  const { user, workspace } = await requireWorkspace();
  await prisma.account.updateMany({
    where: { id: accountId, workspaceId: workspace.id },
    data: { archived: true },
  });
  await audit(user.id, "archive", "account", {
    workspaceId: workspace.id,
    entityId: accountId,
  });
  revalidatePath("/app/contas");
}
