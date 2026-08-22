import { brl, monthKey } from "./money";
import { categorySpend, monthSummary, projectedCashflow } from "./queries";
import { listBudgets, listCategories } from "./store";

export type Insight = {
  title: string;
  body: string;
  tone: "ok" | "warn" | "info";
};

type NamedCategory = { id: string; name: string; kind?: string };

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const KEYWORDS: Array<[string[], string]> = [
  [["ifood", "rappi", "supermercado", "mercado", "padaria", "acougue", "lanchonete", "restaurante", "pizza", "burger", "mcdonald", "hortifruti", "sacolao"], "Alimentação"],
  [["uber", "99pop", "99 ", "gasolina", "combustivel", "posto", "estacionamento", "pedagio", "onibus", "metro", "passagem"], "Transporte"],
  [["aluguel", "condominio", "iptu", "luz", "energia", "agua", "enel", "sabesp"], "Moradia"],
  [["farmacia", "drogaria", "hospital", "consulta", "dentista", "unimed", "plano de saude"], "Saúde"],
  [["netflix", "spotify", "disney", "prime video", "youtube", "canva", "assinatura"], "Assinaturas"],
  [["escola", "faculdade", "curso", "udemy", "alura"], "Educação"],
  [["cinema", "show", "viagem", "hotel", "bar", "lazer"], "Lazer"],
  [["shopee", "mercado livre", "magazine", "amazon", "shein", "compra"], "Compras"],
  [["internet", "claro", "vivo", "tim", "fatura", "telefone"], "Contas"],
  [["salario", "folha de pagamento"], "Salário"],
  [["freelance", "freela"], "Freelance"],
  [["cliente", "venda", "servico", "projeto"], "Serviços"],
  [["das", "imposto", "inss", "iss", "irpf", "simples nacional"], "Impostos"],
  [["fornecedor", "nota fiscal"], "Fornecedores"],
  [["ads", "anuncio", "marketing", "instagram ads"], "Marketing"],
  [["dominio", "hospedagem", "vercel", "hostinger"], "Operacional"],
];

export function suggestCategory<T extends NamedCategory>(
  description: string,
  type: "INCOME" | "EXPENSE" | string,
  categories: T[],
): T | null {
  const text = normalize(description);
  if (!text) return null;
  const wantedKind = type === "INCOME" ? "INCOME" : type === "EXPENSE" ? "EXPENSE" : null;
  const pool = wantedKind ? categories.filter((c) => !c.kind || c.kind === wantedKind) : categories;
  const matchedName = KEYWORDS.find(([words]) => words.some((word) => text.includes(word)))?.[1];
  if (matchedName) {
    const exact = pool.find((c) => normalize(c.name) === normalize(matchedName));
    if (exact) return exact;
  }
  return pool.find((c) => text.includes(normalize(c.name))) ?? null;
}

export function applyCategorySuggestion(
  description: string,
  type: "INCOME" | "EXPENSE",
  currentName: string | undefined,
  categories: NamedCategory[],
) {
  if (currentName?.trim()) {
    const existing = categories.find((c) => normalize(c.name) === normalize(currentName));
    if (existing) return existing;
  }
  return suggestCategory(description, type, categories);
}

export function buildInsights(workspaceId: string, month = monthKey()): Insight[] {
  const summary = monthSummary(workspaceId, month);
  const projection = projectedCashflow(workspaceId, month);
  const spend = categorySpend(workspaceId, month);
  const budgets = listBudgets(workspaceId, month);
  const categories = listCategories(workspaceId);
  const insights: Insight[] = [];

  if (!summary.txs.length) {
    return [
      {
        title: "Explicar o mês",
        body: "Lance ou importe movimentações deste mês. A IA usa os seus números e aponta o lançamento.",
        tone: "info",
      },
    ];
  }

  if (summary.net >= 0) {
    insights.push({
      title: "Mês no azul",
      body: `Entraram ${brl(summary.income)} e saíram ${brl(summary.expense)}. Sobrou ${brl(summary.net)}.`,
      tone: "ok",
    });
  } else {
    insights.push({
      title: "Mês no vermelho",
      body: `As despesas (${brl(summary.expense)}) passaram as receitas (${brl(summary.income)}) em ${brl(Math.abs(summary.net))}.`,
      tone: "warn",
    });
  }

  const top = spend[0];
  if (top && summary.expense > 0) {
    const share = Math.round((top.amount / summary.expense) * 100);
    insights.push({
      title: "O que mais pesou",
      body: `${top.name} levou ${brl(top.amount)} — cerca de ${share}% das despesas do mês.`,
      tone: "info",
    });
  }

  for (const budget of budgets) {
    const category = categories.find((c) => c.id === budget.categoryId);
    if (!category || budget.amount <= 0) continue;
    const actual = spend.find((s) => s.name === category.name)?.amount ?? 0;
    if (actual > budget.amount) {
      insights.push({
        title: `Desvio em ${category.name}`,
        body: `Orçado ${brl(budget.amount)}, gasto ${brl(actual)}. Passou ${brl(actual - budget.amount)}.`,
        tone: "warn",
      });
    }
  }

  if (projection.projectedBalance < projection.currentBalance) {
    insights.push({
      title: "Ritmo de caixa",
      body: `Se o mês continuar assim, o saldo tende a ir de ${brl(projection.currentBalance)} para ${brl(projection.projectedBalance)}.`,
      tone: "warn",
    });
  }

  const uncategorized = summary.txs.filter((t) => t.type !== "TRANSFER" && !t.category).length;
  if (uncategorized) {
    insights.push({
      title: "Sem categoria",
      body: `${uncategorized} lançamento(s) deste mês sem categoria. A IA sugere na hora de lançar ou importar.`,
      tone: "info",
    });
  }

  return insights.slice(0, 4);
}
