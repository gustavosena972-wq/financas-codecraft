"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listBudgets, listCategories, requireSession } from "@/lib/store";
import { brl, formatMonthLabel, monthKey, shiftMonth } from "@/lib/money";
import { monthSummary } from "@/lib/queries";
import { saveBudgetAction } from "@/app/actions/budgets";
import { ActionForm } from "@/components/action-form";
import { BudgetBars } from "@/components/charts";
import { go } from "@/lib/types";

export default function BudgetPage() {
  const [month, setMonth] = useState(monthKey());
  const [rows, setRows] = useState<{ id: string; name: string; planned: number; actual: number }[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("month") ?? monthKey();
    setMonth(m);
    const session = requireSession();
    if (!session) {
      go("/login");
      return;
    }
    const categories = listCategories(session.workspace.id).filter((c) => c.kind === "EXPENSE");
    const budgets = listBudgets(session.workspace.id, m);
    const summary = monthSummary(session.workspace.id, m);
    const spent = new Map<string, number>();
    for (const tx of summary.txs.filter((t) => t.type === "EXPENSE" && t.categoryId)) {
      spent.set(tx.categoryId!, (spent.get(tx.categoryId!) ?? 0) + tx.amount);
    }
    setRows(
      categories.map((category) => ({
        id: category.id,
        name: category.name,
        planned: budgets.find((b) => b.categoryId === category.id)?.amount ?? 0,
        actual: spent.get(category.id) ?? 0,
      })),
    );
  }, []);

  const chartRows = rows.filter((r) => r.planned > 0 || r.actual > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Orçamento mensal</h1>
          <p className="text-sm text-muted capitalize">{formatMonthLabel(month)} — previsto × realizado</p>
        </div>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/app/orcamento?month=${shiftMonth(month, -1)}`}>Mês anterior</Link>
          <Link className="btn btn-ghost" href={`/app/orcamento?month=${shiftMonth(month, 1)}`}>Próximo</Link>
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
