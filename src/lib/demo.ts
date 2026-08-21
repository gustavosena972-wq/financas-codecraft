import { getSupabase } from "./supabase";
import { addTransaction, ensureProfile, refreshSession, setLastWorkspace } from "./store";
import { provisionWorkspace } from "./workspace";
import { monthKey } from "./money";
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
  const wallet = accounts.find((a) => a.type === "WALLET") ?? accounts[0];
  if (!checking || !wallet) return created.data.user;
  const byName = (name: string) => categories.find((c) => c.name === name);
  const month = monthKey();
  const [y, m] = month.split("-");
  const rows = [
    { day: 1, description: "Salário", amount: 850000, type: "INCOME" as const, category: "Salário", accountId: checking.id },
    { day: 2, description: "Aluguel", amount: 220000, type: "EXPENSE" as const, category: "Moradia", accountId: checking.id },
    { day: 3, description: "Supermercado Extra", amount: 48730, type: "EXPENSE" as const, category: "Alimentação", accountId: checking.id },
    { day: 5, description: "Combustível", amount: 28000, type: "EXPENSE" as const, category: "Transporte", accountId: checking.id },
    { day: 6, description: "Farmácia", amount: 6720, type: "EXPENSE" as const, category: "Saúde", accountId: wallet.id },
    { day: 8, description: "Netflix", amount: 5590, type: "EXPENSE" as const, category: "Assinaturas", accountId: checking.id },
    { day: 10, description: "Freelance design", amount: 180000, type: "INCOME" as const, category: "Freelance", accountId: checking.id },
    { day: 12, description: "Padaria", amount: 3840, type: "EXPENSE" as const, category: "Alimentação", accountId: wallet.id },
    { day: 14, description: "Conta de luz", amount: 18990, type: "EXPENSE" as const, category: "Contas", accountId: checking.id },
    { day: 16, description: "Cinema", amount: 7200, type: "EXPENSE" as const, category: "Lazer", accountId: wallet.id },
    { day: 18, description: "Mercado", amount: 31250, type: "EXPENSE" as const, category: "Alimentação", accountId: checking.id },
    { day: 20, description: "Plano de saúde", amount: 42000, type: "EXPENSE" as const, category: "Saúde", accountId: checking.id },
  ];
  for (const row of rows) {
    await addTransaction({
      id: newId(),
      workspaceId: personal.id,
      accountId: row.accountId,
      categoryId: byName(row.category)?.id ?? null,
      type: row.type,
      amount: row.amount,
      date: `${y}-${m}-${String(row.day).padStart(2, "0")}T12:00:00`,
      description: row.description,
      transferToAccountId: null,
      importHash: null,
      createdAt: nowIso(),
    });
  }
  return created.data.user;
}
