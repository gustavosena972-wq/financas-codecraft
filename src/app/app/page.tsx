import { requireWorkspace } from "@/lib/auth";
import { brl, formatMonthLabel, monthKey } from "@/lib/money";
import {
  accountBalances,
  cashflowSeries,
  categorySpend,
  monthSummary,
  projectedCashflow,
} from "@/lib/queries";
import { CashflowChart, CategoryChart } from "@/components/charts";
import Link from "next/link";

export default async function DashboardPage() {
  const { workspace } = await requireWorkspace();
  const month = monthKey();
  const [accounts, summary, series, categories, projection] = await Promise.all([
    accountBalances(workspace.id),
    monthSummary(workspace.id, month),
    cashflowSeries(workspace.id),
    categorySpend(workspace.id, month),
    projectedCashflow(workspace.id, month),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs tracking-[0.14em] uppercase text-muted">Visão geral</p>
        <h1 className="text-2xl font-semibold mt-1 capitalize">{formatMonthLabel(month)}</h1>
        <p className="text-sm text-muted">
          {workspace.type === "BUSINESS" ? workspace.name : "Modo pessoal"} — saldo, tendência e o que mais pesou.
        </p>
      </div>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Saldo atual" value={brl(projection.currentBalance)} />
        <Metric label="Receitas" value={brl(summary.income)} tone="positive" />
        <Metric label="Despesas" value={brl(summary.expense)} tone="negative" />
        <Metric label="Projeção de saldo" value={brl(projection.projectedBalance)} hint="Com o ritmo deste mês" />
      </section>

      <section className="grid lg:grid-cols-5 gap-4">
        <div className="card p-5 lg:col-span-3">
          <h2 className="font-semibold mb-4">Receitas × despesas</h2>
          <CashflowChart data={series} />
        </div>
        <div className="card p-5 lg:col-span-2">
          <h2 className="font-semibold mb-4">Gastos por categoria</h2>
          <CategoryChart data={categories} />
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Contas</h2>
            <Link href="/app/contas" className="text-sm text-muted">
              Ver todas
            </Link>
          </div>
          <ul className="space-y-2">
            {accounts.map((account) => (
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
            <Link href="/app/lancamentos" className="text-sm text-muted">
              Novo
            </Link>
          </div>
          <ul className="space-y-2">
            {summary.txs.slice(0, 7).map((tx) => (
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
            {!summary.txs.length ? <p className="text-sm text-muted">Nenhum lançamento neste mês.</p> : null}
          </ul>
        </div>
      </section>
    </div>
  );
}

function Metric({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div
        className={`text-2xl font-semibold mt-2 ${
          tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""
        }`}
      >
        {value}
      </div>
      {hint ? <div className="text-xs text-muted mt-1">{hint}</div> : null}
    </div>
  );
}
