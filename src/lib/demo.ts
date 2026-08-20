import { prisma } from "./prisma";
import { hashPassword } from "./auth";
import { provisionWorkspace } from "./workspace";
import { monthKey, parseISODate } from "./money";

const DEMO_EMAIL = "demo@codecraft.local";
const DEMO_PASSWORD = "demo1234";

export async function ensureDemoUser() {
  const existing = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { workspaces: { include: { accounts: true, categories: true } } },
  });
  if (existing) return existing;

  const user = await prisma.user.create({
    data: {
      name: "Conta demonstração",
      email: DEMO_EMAIL,
      passwordHash: await hashPassword(DEMO_PASSWORD),
    },
  });

  const personal = await provisionWorkspace(user.id, "Pessoal", "PERSONAL");
  await provisionWorkspace(user.id, "Empresa Demo", "BUSINESS");
  await prisma.user.update({
    where: { id: user.id },
    data: { lastWorkspaceId: personal.id },
  });

  const accounts = await prisma.account.findMany({ where: { workspaceId: personal.id } });
  const categories = await prisma.category.findMany({ where: { workspaceId: personal.id } });
  const checking = accounts.find((a) => a.type === "CHECKING") ?? accounts[0];
  const wallet = accounts.find((a) => a.type === "WALLET") ?? accounts[0];
  const byName = (name: string) => categories.find((c) => c.name === name);

  const month = monthKey();
  const [y, m] = month.split("-");
  const rows: Array<{
    day: number;
    description: string;
    amount: number;
    type: "INCOME" | "EXPENSE";
    category: string;
    accountId: string;
  }> = [
    { day: 1, description: "Salário", amount: 850000, type: "INCOME", category: "Salário", accountId: checking.id },
    { day: 2, description: "Aluguel", amount: 220000, type: "EXPENSE", category: "Moradia", accountId: checking.id },
    { day: 3, description: "Supermercado Extra", amount: 48730, type: "EXPENSE", category: "Alimentação", accountId: checking.id },
    { day: 5, description: "Combustível", amount: 28000, type: "EXPENSE", category: "Transporte", accountId: checking.id },
    { day: 6, description: "Farmácia", amount: 6720, type: "EXPENSE", category: "Saúde", accountId: wallet.id },
    { day: 8, description: "Netflix", amount: 5590, type: "EXPENSE", category: "Assinaturas", accountId: checking.id },
    { day: 10, description: "Freelance design", amount: 180000, type: "INCOME", category: "Freelance", accountId: checking.id },
    { day: 12, description: "Padaria", amount: 3840, type: "EXPENSE", category: "Alimentação", accountId: wallet.id },
    { day: 14, description: "Conta de luz", amount: 18990, type: "EXPENSE", category: "Contas", accountId: checking.id },
    { day: 16, description: "Cinema", amount: 7200, type: "EXPENSE", category: "Lazer", accountId: wallet.id },
    { day: 18, description: "Mercado", amount: 31250, type: "EXPENSE", category: "Alimentação", accountId: checking.id },
    { day: 20, description: "Plano de saúde", amount: 42000, type: "EXPENSE", category: "Saúde", accountId: checking.id },
  ];

  await prisma.transaction.createMany({
    data: rows.map((row) => ({
      workspaceId: personal.id,
      accountId: row.accountId,
      categoryId: byName(row.category)?.id,
      type: row.type,
      amount: row.amount,
      date: parseISODate(`${y}-${m}-${String(row.day).padStart(2, "0")}`),
      description: row.description,
    })),
  });

  const food = byName("Alimentação");
  const home = byName("Moradia");
  const transport = byName("Transporte");
  if (food && home && transport) {
    await prisma.budget.createMany({
      data: [
        { workspaceId: personal.id, categoryId: food.id, month, amount: 120000 },
        { workspaceId: personal.id, categoryId: home.id, month, amount: 230000 },
        { workspaceId: personal.id, categoryId: transport.id, month, amount: 50000 },
      ],
    });
  }

  return prisma.user.findUniqueOrThrow({ where: { id: user.id } });
}

export const demoCredentials = { email: DEMO_EMAIL, password: DEMO_PASSWORD };
