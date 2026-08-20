import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brl, monthKey, startOfMonth, endOfMonth } from "@/lib/money";
import { TransactionForm } from "@/components/transaction-form";
import { deleteTransactionAction } from "@/app/actions/transactions";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const month = (await searchParams).month ?? monthKey();
  const [accounts, categories, txs] = await Promise.all([
    prisma.account.findMany({
      where: { workspaceId: workspace.id, archived: false },
      orderBy: { name: "asc" },
    }),
    prisma.category.findMany({
      where: { workspaceId: workspace.id },
      orderBy: { name: "asc" },
    }),
    prisma.transaction.findMany({
      where: {
        workspaceId: workspace.id,
        date: { gte: startOfMonth(month), lte: endOfMonth(month) },
      },
      include: { account: true, category: true },
      orderBy: { date: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <p className="text-sm text-muted">Receitas, despesas e transferências internas.</p>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold mb-4">Novo lançamento</h2>
        <TransactionForm accounts={accounts} categories={categories} />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {txs.map((tx) => (
              <tr key={tx.id}>
                <td className="whitespace-nowrap">{tx.date.toLocaleDateString("pt-BR")}</td>
                <td>{tx.description}</td>
                <td>{tx.category?.name ?? (tx.type === "TRANSFER" ? "Transferência" : "—")}</td>
                <td>{tx.account.name}</td>
                <td className={tx.type === "INCOME" ? "text-positive" : tx.type === "EXPENSE" ? "text-negative" : ""}>
                  {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : ""}
                  {brl(tx.amount)}
                </td>
                <td>
                  <form action={deleteTransactionAction.bind(null, tx.id)}>
                    <button className="text-xs text-muted">Excluir</button>
                  </form>
                </td>
              </tr>
            ))}
            {!txs.length ? (
              <tr>
                <td colSpan={6} className="text-muted">
                  Nenhum lançamento neste mês.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
