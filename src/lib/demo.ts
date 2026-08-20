import { findUserByEmail, loadDb, saveDb, setSessionUserId, setSessionWorkspaceId } from "./store";
import { provisionWorkspace } from "./workspace";
import { monthKey } from "./money";
import { newId, nowIso } from "./types";

const DEMO_EMAIL = "demo@codecraft.local";
const DEMO_PASSWORD = "demo1234";

export async function hashPassword(password: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`ccs:${password}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(password: string, hash: string) {
  return (await hashPassword(password)) === hash;
}

export async function ensureDemoUser() {
  const existing = findUserByEmail(DEMO_EMAIL);
  if (existing) return existing;

  const user = {
    id: newId(),
    name: "Conta demonstração",
    email: DEMO_EMAIL,
    passwordHash: await hashPassword(DEMO_PASSWORD),
    lastWorkspaceId: null as string | null,
    createdAt: nowIso(),
  };
  const db = loadDb();
  db.users.push(user);
  saveDb(db);

  const personal = provisionWorkspace(user.id, "Pessoal", "PERSONAL");
  provisionWorkspace(user.id, "Empresa Demo", "BUSINESS");
  const next = loadDb();
  const me = next.users.find((u) => u.id === user.id)!;
  me.lastWorkspaceId = personal.id;
  saveDb(next);

  const accounts = next.accounts.filter((a) => a.workspaceId === personal.id);
  const categories = next.categories.filter((c) => c.workspaceId === personal.id);
  const checking = accounts.find((a) => a.type === "CHECKING") ?? accounts[0];
  const wallet = accounts.find((a) => a.type === "WALLET") ?? accounts[0];
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
  const db2 = loadDb();
  for (const row of rows) {
    db2.transactions.push({
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
  const food = byName("Alimentação");
  const home = byName("Moradia");
  const transport = byName("Transporte");
  if (food && home && transport) {
    db2.budgets.push(
      { id: newId(), workspaceId: personal.id, categoryId: food.id, month, amount: 120000 },
      { id: newId(), workspaceId: personal.id, categoryId: home.id, month, amount: 230000 },
      { id: newId(), workspaceId: personal.id, categoryId: transport.id, month, amount: 50000 },
    );
  }
  saveDb(db2);
  return loadDb().users.find((u) => u.id === user.id)!;
}

export function loginSession(userId: string, workspaceId?: string | null) {
  setSessionUserId(userId);
  if (workspaceId) setSessionWorkspaceId(workspaceId);
}

export function logoutSession() {
  setSessionUserId(null);
  setSessionWorkspaceId(null);
}

export const demoCredentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
