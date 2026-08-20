"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/store";
import { brl, formatMonthLabel, monthKey } from "@/lib/money";
import { accountBalances, cashflowSeries, categorySpend, monthSummary, projectedCashflow } from "@/lib/queries";
import { CashflowChart, CategoryChart } from "@/components/charts";
import { go } from "@/lib/types";

export default function DashboardPage() {
  const [view, setView] = useState<ReturnType<typeof build> | null>(null);

  useEffect(() => {
    const session = requireSession();
    if (!session) {
      go("/login");
      return;
    }
    setView(build(session.workspace.id, session.workspace.type === "BUSINESS" ? session.workspace.name : "Modo pessoal"));
  }, []);

  if (!view) return null;
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.14em] uppercase text-muted">Visão geral</p>
        <h1 className="text-2xl font-semibold mt-1 capitalize">{formatMonthLabel(view.month)}</h1>
        <p className="text-sm text-muted">{view.label} — saldo, tendência e o que mais pesou.</p>
      </div>
      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Saldo atual" value={brl(view.projection.currentBalance)} />
        <Metric label="Receitas" value={brl(view.summary.income)} tone="positive" />
        <Metric label="Despesas" value={brl(view.summary.expense)} tone="negative" />
        <Metric label="Projeção de saldo" value={brl(view.projection.projectedBalance)} hint="Com o ritmo deste mês" />
      </section>
      <section className="grid lg:grid-cols-5 gap-4">
        <div className="card p-5 lg:col-span-3">
          <h2 className="font-semibold mb-4">Receitas × despesas</h2>
          <CashflowChart data={view.series} />
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Gastos por categoria</h2>
          <CategoryChart data={view.categories} />
        </div>
      </section>
      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Contas</h2>
            <Link href="/app/contas" className="text-sm text-muted">Ver todas</Link>
          </div>
          <ul className="space-y-2">
            {view.accounts.map((account) => (
              <li key={account.id} className="flex justify-between text-sm py-2 border-b border-line last:border-0">
                <span>{account.name}</span>
                <span className="font-mono">{brl(account.balance)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Últimos lançamentos</h2>
            <Link href="/app/lancamentos" className="text-sm text-muted">Novo</Link>
          </div>
          <ul className="space-y-2">
            {view.summary.txs.slice(0, 7).map((tx) => (
              <li key={tx.id} className="flex justify-between gap-3 text-sm py-2 border-b border-line last:border-0">
                <div>
                  <div>{tx.description}</div>
                  <div className="text-xs text-muted">{tx.category?.name ?? tx.account.name}</div>
                </div>
                <span className={tx.type === "INCOME" ? "text-positive" : tx.type === "EXPENSE" ? "text-negative" : "text-muted"}>
                  {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : ""}
                  {brl(tx.amount)}
                </span>
              </li>
            ))}
            {!view.summary.txs.length ? <p className="text-sm text-muted">Nenhum lançamento neste mês.</p> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

function build(workspaceId: string, label: string) {
  const month = monthKey();
  return {
    month,
    label,
    accounts: accountBalances(workspaceId),
    summary: monthSummary(workspaceId, month),
    series: cashflowSeries(workspaceId),
    categories: categorySpend(workspaceId, month),
    projection: projectedCashflow(workspaceId, month),
  };
}

function Metric({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "positive" | "negative" }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className={`text-2xl font-semibold mt-2 ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>
        {value}
      </div>
      {hint ? <div className="text-xs text-muted mt-1">{hint}</div> : null}
    </div>
  );
}
