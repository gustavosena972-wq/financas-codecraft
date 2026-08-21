import { pushAudit, requireSession, upsertBudget } from "@/lib/store";
import { parseMoneyToCents } from "@/lib/money";
import { newId } from "@/lib/types";

export type BudgetState = { error?: string; ok?: string } | null;

export async function saveBudgetAction(_prev: BudgetState, formData: FormData): Promise<BudgetState> {
  const session = await requireSession();
  if (!session) return { error: "Sessão expirada." };
  const month = String(formData.get("month") ?? "");
  const categoryId = String(formData.get("categoryId") ?? "");
  const amount = parseMoneyToCents(String(formData.get("amount") ?? ""));
  if (!month || !categoryId) return { error: "Categoria e mês são obrigatórios." };
  if (amount == null || amount < 0) return { error: "Valor inválido." };
  await upsertBudget({
    id: newId(),
    workspaceId: session.workspace.id,
    categoryId,
    month,
    amount: Math.abs(amount),
  });
  await pushAudit(session.user.id, "upsert", "budget", { workspaceId: session.workspace.id, detail: month });
  return { ok: "Orçamento atualizado." };
}
