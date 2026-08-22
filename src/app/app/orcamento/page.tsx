"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listBudgets, listCategories, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl, formatMonthLabel, monthKey, shiftMonth } from "@/lib/money";
import { monthSummary } from "@/lib/queries";
import { saveBudgetAction } from "@/app/actions/budgets";
import { ActionForm } from "@/components/action-form";
import { BudgetBars } from "@/components/charts";
import { familyMonthItems, familyGroupLabel, type FamilyGroup } from "@/lib/family-budget";
import { familyOutlook } from "@/lib/family-forecast";
import { go } from "@/lib/types";

const GROUPS: FamilyGroup[] = ["cards", "fixed", "other"];

export default function BudgetPage() {
  const live = useLive();
  const [month, setMonth] = useState(monthKey());
  const [rows, setRows] = useState<{ id: string; name: string; planned: number; actual: number }[]>([]);
  const [items, setItems] = useState<ReturnType<typeof familyMonthItems>>([]);
  const [income, setIncome] = useState(0);
  const [outlook, setOutlook] = useState<ReturnType<typeof familyOutlook> | null>(null);
  const [company, setCompany] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get("month") ?? monthKey();
    setMonth(m);
    void (async () => {
      const session = await requireSession();
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
      setCompany(session.workspace.type === "BUSINESS");
      setItems(familyMonthItems(session.workspace.id, m));
      setIncome(summary.income);
      setOutlook(familyOutlook(session.workspace.id));
      setRows(
        categories.map((category) => ({
          id: category.id,
          name: category.name,
          planned: budgets.find((b) => b.categoryId === category.id)?.amount ?? 0,
          actual: spent.get(category.id) ?? 0,
        })),
      );
    })();
  }, [live]);

  const chartRows = rows.filter((r) => r.planned > 0 || r.actual > 0);
  const expense = items.reduce((s, item) => s + item.amount, 0);
  const net = income - expense;

  if (!company) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <p className="page-kicker">Um mês de cada vez</p>
          <h1 className="text-2xl font-semibold capitalize">{formatMonthLabel(month)}</h1>
          <p className="text-sm text-muted mt-1">Primeiro o resumo. Embaixo, de onde sai o dinheiro. Um grupo por vez, sem uma caixa em cima da outra.</p>
          <div className="flex gap-2 mt-3">
            <Link className="btn btn-ghost" href={`/app/orcamento?month=${shiftMonth(month, -1)}`}>
              Mês de trás
            </Link>
            <Link className="btn btn-ghost" href={`/app/orcamento?month=${shiftMonth(month, 1)}`}>
              Mês da frente
            </Link>
          </div>
        </div>

        {!items.length ? (
          <article className="card p-6 space-y-3">
            <h2 className="font-semibold">Este mês ainda está vazio</h2>
            <p className="text-sm text-muted">Manda o Excel da casa. O app monta sozinho o que vai sair.</p>
            <Link href="/app/importar" className="btn btn-primary">
              Mandar a planilha
            </Link>
          </article>
        ) : (
          <>
            <article className="card p-6 space-y-4">
              <div>
                <p className="text-sm text-muted">Este mês vai gastar</p>
                <p className="text-3xl font-semibold">{brl(expense)}</p>
              </div>
              <div>
                <p className="text-sm text-muted">{net >= 0 ? "Vai sobrar" : "Vai faltar"}</p>
                <p className={`text-4xl font-semibold ${net < 0 ? "text-negative" : "text-positive"}`}>{brl(Math.abs(net))}</p>
              </div>
              <p className="text-sm text-muted">Entra {income ? brl(income) : "sem receita neste mês"}.</p>
            </article>

            {GROUPS.map((group) => {
              const groupRows = items.filter((item) => item.group === group);
              const total = groupRows.reduce((s, item) => s + item.amount, 0);
              return (
                <article key={group} className={`card p-5 fam-block ${group}`}>
                  <div className="flex justify-between gap-4 items-baseline">
                    <h2 className="font-semibold">{familyGroupLabel(group)}</h2>
                    <p className="text-lg font-semibold">{brl(total)}</p>
                  </div>
                  <ul className="mt-2">
                    {groupRows.map((item) => (
                      <li key={item.id} className="fam-line text-sm">
                        <span>
                          {item.description}
                          {item.notes ? <span className="fam-sub block">{item.notes}</span> : null}
                        </span>
                        <strong>{brl(item.amount)}</strong>
                      </li>
                    ))}
                    {!groupRows.length ? <li className="text-sm text-muted pt-2">Nada neste grupo.</li> : null}
                  </ul>
                </article>
              );
            })}

            {outlook && !outlook.empty ? (
              <article className="card p-5">
                <h2 className="font-semibold">Os meses que ainda vêm</h2>
                <p className="text-sm text-muted mt-1">
                  Daqui até dezembro ainda sai {brl(outlook.rest.expense)}. No ano{" "}
                  {outlook.yearTotal.leftover >= 0
                    ? `sobra ${brl(outlook.yearTotal.leftover)}`
                    : `falta ${brl(Math.abs(outlook.yearTotal.leftover))}`}
                  .
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {outlook.series
                    .filter((row) => row.kind !== "past" && (row.income || row.expense))
                    .map((row) => (
                      <li key={row.month} className="fam-line">
                        <span className="capitalize">{formatMonthLabel(row.month).split(" ")[0]}</span>
                        <span>
                          sai {brl(row.expense)} ·{" "}
                          <span className={row.net < 0 ? "text-negative" : "text-positive"}>
                            {row.net >= 0 ? `sobra ${brl(row.net)}` : `falta ${brl(Math.abs(row.net))}`}
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </article>
            ) : null}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Teto do mês</h1>
          <p className="text-sm text-muted max-w-2xl capitalize">
            Você põe um limite por categoria. O app avisa se passou. {formatMonthLabel(month)}.
          </p>
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
