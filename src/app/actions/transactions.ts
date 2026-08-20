"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { audit, requireWorkspace } from "@/lib/auth";
import { parseISODate, parseMoneyToCents } from "@/lib/money";

const txSchema = z.object({
  type: z.nativeEnum(TransactionType),
  amount: z.string().min(1),
  date: z.string().min(8),
  description: z.string().trim().min(2, "Descreva o lançamento"),
  accountId: z.string().min(1),
  categoryId: z.string().optional(),
  transferToAccountId: z.string().optional(),
  notes: z.string().optional(),
});

export type TxState = { error?: string; ok?: string } | null;

export async function createTransactionAction(
  _prev: TxState,
  formData: FormData,
): Promise<TxState> {
  const { user, workspace } = await requireWorkspace();
  const parsed = txSchema.safeParse({
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
  const amount = Math.abs(cents);

  if (parsed.data.type === "TRANSFER" && !parsed.data.transferToAccountId) {
    return { error: "Escolha a conta de destino." };
  }

  const tx = await prisma.transaction.create({
    data: {
      workspaceId: workspace.id,
      accountId: parsed.data.accountId,
      categoryId: parsed.data.type === "TRANSFER" ? null : parsed.data.categoryId || null,
      type: parsed.data.type,
      amount,
      date: parseISODate(parsed.data.date),
      description: parsed.data.description,
      notes: parsed.data.notes,
      transferToAccountId:
        parsed.data.type === "TRANSFER" ? parsed.data.transferToAccountId : null,
    },
  });

  await audit(user.id, "create", "transaction", {
    workspaceId: workspace.id,
    entityId: tx.id,
    detail: parsed.data.description,
  });
  revalidatePath("/app");
  revalidatePath("/app/lancamentos");
  revalidatePath("/app/fluxo");
  revalidatePath("/app/orcamento");
  return { ok: "Lançamento salvo." };
}

export async function deleteTransactionAction(id: string) {
  const { user, workspace } = await requireWorkspace();
  await prisma.transaction.deleteMany({
    where: { id, workspaceId: workspace.id },
  });
  await audit(user.id, "delete", "transaction", {
    workspaceId: workspace.id,
    entityId: id,
  });
  revalidatePath("/app");
  revalidatePath("/app/lancamentos");
  revalidatePath("/app/fluxo");
  revalidatePath("/app/orcamento");
}
