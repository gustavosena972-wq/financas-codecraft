import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brl, formatMonthLabel, monthKey, shiftMonth } from "@/lib/money";
import { monthSummary } from "@/lib/queries";
import { saveBudgetAction } from "@/app/actions/budgets";
import { ActionForm } from "@/components/action-form";
import { BudgetBars } from "@/components/charts";
import Link from "next/link";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const month = (await searchParams).month ?? monthKey();
  const [categories, budgets, summary] = await Promise.all([
    prisma.category.findMany({
      where: { workspaceId: workspace.id, kind: "EXPENSE" },
      orderBy: { name: "asc" },
    }),
    prisma.budget.findMany({ where: { workspaceId: workspace.id, month } }),
    monthSummary(workspace.id, month),
  ]);

  const spent = new Map<string, number>();
  for (const tx of summary.txs.filter((t) => t.type === "EXPENSE" && t.categoryId)) {
    spent.set(tx.categoryId!, (spent.get(tx.categoryId!) ?? 0) + tx.amount);
  }

  const rows = categories.map((category) => {
    const planned = budgets.find((b) => b.categoryId === category.id)?.amount ?? 0;
    const actual = spent.get(category.id) ?? 0;
    return { id: category.id, name: category.name, planned, actual };
  });
  const chartRows = rows.filter((r) => r.planned > 0 || r.actual > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Orçamento mensal</h1>
          <p className="text-sm text-muted capitalize">{formatMonthLabel(month)} — previsto × realizado</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/app/orcamento?month=${shiftMonth(month, -1)}`}>
            Mês anterior
          </Link>
          <Link className="btn btn-ghost" href={`/app/orcamento?month=${shiftMonth(month, 1)}`}>
            Próximo
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <BudgetBars data={chartRows} />
      </div>

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Categoria</th>
              <th>Planejado</th>
              <th>Realizado</th>
              <th>Diferença</th>
              <th>Definir</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.name}</td>
                <td>{row.planned ? brl(row.planned) : "—"}</td>
                <td>{brl(row.actual)}</td>
                <td className={row.planned && row.actual > row.planned ? "text-negative" : "text-positive"}>
                  {row.planned ? brl(row.planned - row.actual) : "—"}
                </td>
                <td>
                  <ActionForm action={saveBudgetAction} className="flex items-center gap-2" submitLabel="Ok">
                    <input type="hidden" name="month" value={month} />
                    <input type="hidden" name="categoryId" value={row.id} />
                    <input
                      name="amount"
                      className="w-28 rounded-lg border border-line px-2 py-1 text-sm"
                      placeholder="0,00"
                      defaultValue={row.planned ? (row.planned / 100).toFixed(2).replace(".", ",") : ""}
                    />
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
