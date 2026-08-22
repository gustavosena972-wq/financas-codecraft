import { getSupabase } from "./supabase";
import { addTransaction, ensureProfile, refreshSession, setLastWorkspace } from "./store";
import { provisionWorkspace } from "./workspace";
import { monthKey, shiftMonth } from "./money";
import { newId, nowIso } from "./types";

export const demoCredentials = { email: "demo@codecraft.local", password: "demo1234" };

export async function ensureDemoUser() {
  const supabase = getSupabase();
  const existing = await supabase.auth.signInWithPassword({
    email: demoCredentials.email,
    password: demoCredentials.password,
  });
  if (!existing.error && existing.data.user) {
    await refreshSession();
    return existing.data.user;
  }

  const created = await supabase.auth.signUp({
    email: demoCredentials.email,
    password: demoCredentials.password,
    options: { data: { name: "Conta demonstração" } },
  });
  if (created.error || !created.data.user) {
    throw new Error(created.error?.message ?? "Não foi possível abrir a demonstração.");
  }
  const userId = created.data.user.id;
  await ensureProfile(userId, "Conta demonstração");
  const personal = await provisionWorkspace(userId, "Pessoal", "PERSONAL");
  await provisionWorkspace(userId, "Empresa Demo", "BUSINESS");
  await setLastWorkspace(userId, personal.id);
  const session = await refreshSession();
  const accounts = session?.accounts.filter((a) => a.workspaceId === personal.id) ?? [];
  const categories = session?.categories.filter((c) => c.workspaceId === personal.id) ?? [];
  const checking = accounts.find((a) => a.type === "CHECKING") ?? accounts[0];
  const credit = accounts.find((a) => a.type === "CREDIT") ?? checking;
  if (!checking || !credit) return created.data.user;
  const byName = (name: string) => categories.find((c) => c.name === name);
  const months = [shiftMonth(monthKey(), -2), shiftMonth(monthKey(), -1), monthKey()];
  const lines = [
    { description: "Receita prevista", amount: 800000, type: "INCOME" as const, category: "Receita", notes: undefined as string | undefined, accountId: checking.id },
    { description: "Nubank Sandra", amount: 158000, type: "EXPENSE" as const, category: "Cartões de crédito", notes: "PG", accountId: credit.id },
    { description: "Inter Sandra", amount: 228300, type: "EXPENSE" as const, category: "Cartões de crédito", notes: "PG", accountId: credit.id },
    { description: "Will", amount: 95400, type: "EXPENSE" as const, category: "Cartões de crédito", notes: "17 de 18", accountId: credit.id },
    { description: "Casa", amount: 180000, type: "EXPENSE" as const, category: "Fixas / financiamentos", notes: "22 de 48", accountId: checking.id },
    { description: "Luz", amount: 22000, type: "EXPENSE" as const, category: "Fixas / financiamentos", notes: undefined, accountId: checking.id },
    { description: "Água", amount: 8500, type: "EXPENSE" as const, category: "Fixas / financiamentos", notes: undefined, accountId: checking.id },
    { description: "Internet", amount: 12990, type: "EXPENSE" as const, category: "Fixas / financiamentos", notes: undefined, accountId: checking.id },
    { description: "Celular", amount: 8900, type: "EXPENSE" as const, category: "Fixas / financiamentos", notes: undefined, accountId: checking.id },
    { description: "Netflix", amount: 5590, type: "EXPENSE" as const, category: "Fixas / financiamentos", notes: undefined, accountId: checking.id },
    { description: "Festa Heitor", amount: 50000, type: "EXPENSE" as const, category: "Outras / variáveis", notes: undefined, accountId: checking.id },
  ];
  for (const month of months) {
    for (const row of lines) {
      await addTransaction({
        id: newId(),
        workspaceId: personal.id,
        accountId: row.accountId,
        categoryId: byName(row.category)?.id ?? null,
        type: row.type,
        amount: row.amount,
        date: `${month}-01T12:00:00`,
        description: row.description,
        notes: row.notes,
        transferToAccountId: null,
        importHash: null,
        createdAt: nowIso(),
      });
    }
  }
  return created.data.user;
}
