"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listBudgets, listCategories, listGoals, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { brl, formatMonthLabel, monthKey } from "@/lib/money";
import { accountBalances, categorySpend, cashflowSeries, monthSummary } from "@/lib/queries";
import { netWorthSeries, netWorthSnapshot } from "@/lib/net-worth";
import { financePulse } from "@/lib/accountant";
import { buildInsights } from "@/lib/ai";
import { CashflowChart, CategoryChart, NetWorthChart } from "@/components/charts";
import { CountMoney } from "@/components/count-up";
import { AccountantChat } from "@/components/accountant-chat";
import { AiInsights } from "@/components/ai-insights";
import { ToolTiles } from "@/components/tool-tiles";
import { planHasAi } from "@/lib/plans";

type View = {
  company: boolean;
  net: number;
  assets: number;
  debts: number;
  invested: number;
  income: number;
  expense: number;
  pulse: ReturnType<typeof financePulse>;
  series: ReturnType<typeof cashflowSeries>;
  worth: ReturnType<typeof netWorthSeries>;
  spend: ReturnType<typeof categorySpend>;
  txs: ReturnType<typeof monthSummary>["txs"];
  budgets: { name: string; planned: number; actual: number }[];
  goals: { name: string; target: number; pct: number }[];
  insights: ReturnType<typeof buildInsights>;
  ai: boolean;
};

export function HomeDashboard() {
  const live = useLive();
  const [view, setView] = useState<View | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      const id = session.workspace.id;
      const month = monthKey();
      const worth = netWorthSnapshot(id);
      const summary = monthSummary(id, month);
      const spend = categorySpend(id, month);
      const budgets = listBudgets(id, month);
      const categories = listCategories(id);
      const balance = accountBalances(id).reduce((s, a) => s + a.balance, 0);
      setView({
        company: session.workspace.type === "BUSINESS",
        net: worth.net,
        assets: worth.assets,
        debts: worth.debts,
        invested: worth.invested,
        income: summary.income,
        expense: summary.expense,
        pulse: financePulse(id),
        series: cashflowSeries(id, 6),
        worth: netWorthSeries(id, 12),
        spend,
        txs: summary.txs.slice(0, 8),
        budgets: categories
          .filter((c) => c.kind === "EXPENSE")
          .map((c) => ({
            name: c.name,
            planned: budgets.find((b) => b.categoryId === c.id)?.amount ?? 0,
            actual: spend.find((s) => s.name === c.name)?.amount ?? 0,
          }))
          .filter((row) => row.planned > 0 || row.actual > 0)
          .slice(0, 5),
        goals: listGoals(id).map((g) => ({
          name: g.name,
          target: g.target,
          pct: Math.min(100, Math.round((balance / Math.max(g.target, 1)) * 100)),
        })),
        insights: buildInsights(id, month),
        ai: planHasAi(session.user.plan),
      });
    })();
  }, [live]);

  if (!view) return <p className="text-sm text-muted">Carregando o patrimônio…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="page-kicker">{view.company ? "Empresa" : "Pessoa"}</p>
          <h1 className="page-title">Patrimônio líquido</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Tela central: o que você tem, menos o que deve, mais o que está investido. A IA responde com os lançamentos reais.
          </p>
        </div>
        <Link href="/app/chat" className="btn btn-primary">
          Perguntar à IA
        </Link>
      </div>

      <section>
        <div className="flex items-end justify-between gap-3 mb-3">
          <div>
            <p className="page-kicker">Ferramentas</p>
            <h2 className="font-semibold mt-1">O que cada uma faz</h2>
          </div>
          <Link href="/app/ferramentas" className="text-sm underline">
            Ver todas
          </Link>
        </div>
        <ToolTiles mode={view.company ? "BUSINESS" : "PERSONAL"} limit={8} />
      </section>

      <section className="grid lg:grid-cols-[1.4fr_.9fr] gap-4">
        <article className="card p-6">
          <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Patrimônio líquido</div>
          <div className={`text-4xl font-semibold mt-2 ${view.net >= 0 ? "text-ink" : "text-negative"}`}>
            <CountMoney cents={view.net} />
          </div>
          <p className={`text-sm mt-2 health-inline ${view.pulse.level}`}>{view.pulse.label} · {view.pulse.hint}</p>
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Kpi label="Ativos" value={brl(view.assets)} />
            <Kpi label="Dívidas" value={brl(view.debts)} tone="neg" />
            <Kpi label="Investido" value={brl(view.invested)} />
          </div>
          <div className="mt-6">
            <NetWorthChart data={view.worth} />
            <p className="text-[11px] text-muted mt-2">Evolução estimada a partir do caixa de cada mês. Sem Open Finance ainda — o número sai das contas e dos investimentos que você lançou.</p>
          </div>
        </article>
        <article className="card p-5">
          <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Neste mês</div>
          <h2 className="font-semibold mt-1">{formatMonthLabel(monthKey())}</h2>
          <p className="text-sm text-muted mt-2">
            Entrou {brl(view.income)} · saiu {brl(view.expense)} · {view.income - view.expense >= 0 ? "sobra" : "falta"}{" "}
            {brl(Math.abs(view.income - view.expense))}
          </p>
          <div className="mt-4">
            <CategoryChart data={view.spend} />
          </div>
        </article>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Entra e sai</h2>
            <Link href={view.company ? "/app/fluxo" : "/app/lancamentos"} className="text-sm underline">
              Ver tudo
            </Link>
          </div>
          <CashflowChart data={view.series} />
        </article>
        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Orçado × realizado</h2>
            <Link href="/app/orcamento" className="text-sm underline">
              Ajustar teto
            </Link>
          </div>
          {view.budgets.length ? (
            <ul className="mt-4 space-y-3">
              {view.budgets.map((row) => {
                const pct = row.planned ? Math.min(100, Math.round((row.actual / row.planned) * 100)) : 0;
                const over = row.planned > 0 && row.actual > row.planned;
                return (
                  <li key={row.name}>
                    <div className="flex justify-between text-sm">
                      <span>{row.name}</span>
                      <span className={over ? "text-negative" : "text-muted"}>
                        {brl(row.actual)} / {brl(row.planned)}
                      </span>
                    </div>
                    <div className="progress mt-1">
                      <span style={{ width: `${pct}%`, background: over ? "var(--negative)" : "var(--gold)" }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted mt-3">Ainda sem teto neste mês. Defina o envelope em Orçamento — isso é controle, não só relatório.</p>
          )}
        </article>
      </section>

      <section className="grid lg:grid-cols-[1.1fr_.9fr] gap-4">
        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Últimos lançamentos</h2>
            <Link href="/app/lancamentos" className="text-sm underline">
              Lançar
            </Link>
          </div>
          {view.txs.length ? (
            <table className="table mt-3">
              <tbody>
                {view.txs.map((tx) => (
                  <tr key={tx.id}>
                    <td className="text-sm">{tx.date.slice(0, 10)}</td>
                    <td>
                      <div className="text-sm">{tx.description}</div>
                      <div className="text-[11px] text-muted">{tx.category?.name ?? "Sem categoria"}</div>
                    </td>
                    <td className={`text-right text-sm ${tx.type === "INCOME" ? "text-positive" : tx.type === "EXPENSE" ? "text-negative" : ""}`}>
                      {tx.type === "EXPENSE" ? "−" : ""}
                      {brl(tx.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted mt-3">Nada neste mês. Importe o extrato ou lance na mão.</p>
          )}
        </article>
        <div className="space-y-4">
          {!view.company && view.goals.length ? (
            <article className="card p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Metas</h2>
                <Link href="/app/metas" className="text-sm underline">
                  Abrir
                </Link>
              </div>
              <ul className="mt-3 space-y-3">
                {view.goals.slice(0, 3).map((goal) => (
                  <li key={goal.name}>
                    <div className="flex justify-between text-sm">
                      <span>{goal.name}</span>
                      <span className="text-muted">{goal.pct}%</span>
                    </div>
                    <div className="progress mt-1">
                      <span style={{ width: `${goal.pct}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ) : null}
          <AiInsights unlocked={view.ai} insights={view.insights} />
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="px-5 pt-4">
          <p className="page-kicker">Assistente</p>
          <h2 className="font-semibold mt-1">Pergunta à IA. Ela mostra o lançamento.</h2>
          <p className="text-sm text-muted mt-1">Ex.: “quanto gastei com iFood?”. Sem senha. Sem PIX. No grátis são 8 perguntas por dia.</p>
        </div>
        <AccountantChat compact />
      </section>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "neg" }) {
  return (
    <div className="rounded-lg bg-bg px-3 py-3">
      <div className="text-[11px] text-muted uppercase tracking-wide">{label}</div>
      <div className={`text-sm font-semibold mt-1 ${tone === "neg" ? "text-negative" : ""}`}>{value}</div>
    </div>
  );
}
