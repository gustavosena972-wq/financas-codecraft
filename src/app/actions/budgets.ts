"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { audit, requireWorkspace } from "@/lib/auth";
import { parseMoneyToCents } from "@/lib/money";

export type BudgetState = { error?: string; ok?: string } | null;

export async function saveBudgetAction(
  _prev: BudgetState,
  formData: FormData,
): Promise<BudgetState> {
  const { user, workspace } = await requireWorkspace();
  const month = String(formData.get("month") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const amount = parseMoneyToCents(String(formData.get("amount") ?? ""));
  if (!month || !categoryId) return { error: "Categoria e mês são obrigatórios." };
  if (amount == null || amount < 0) return { error: "Valor inválido." };

  await prisma.budget.upsert({
    where: {
      workspaceId_categoryId_month: {
        workspaceId: workspace.id,
        categoryId,
        month,
      },
    },
    update: { amount: Math.abs(amount) },
    create: {
      workspaceId: workspace.id,
      categoryId,
      month,
      amount: Math.abs(amount),
    },
  });
  await audit(user.id, "upsert", "budget", {
    workspaceId: workspace.id,
    entityId: categoryId,
    detail: month,
  });
  revalidatePath("/app/orcamento");
  revalidatePath("/app");
  return { ok: "Orçamento atualizado." };
}
