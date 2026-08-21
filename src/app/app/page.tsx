"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listGoals, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl, formatMonthLabel, monthKey } from "@/lib/money";
import { accountBalances, cashflowSeries, categorySpend, monthAgenda, monthSummary, projectedCashflow } from "@/lib/queries";
import { CashflowChart, CategoryChart } from "@/components/charts";
import { AiInsights } from "@/components/ai-insights";
import { buildInsights } from "@/lib/ai";
import { planHasAi, planHasOps } from "@/lib/plans";
import { billsOverview } from "@/lib/ops";
import { START_STEPS } from "@/lib/guide";
import { go } from "@/lib/types";
import { buildMoneySheet } from "@/lib/coach";
import { CountMoney } from "@/components/count-up";
import { MoneySheet } from "@/components/money-sheet";

export default function DashboardPage() {
  const live = useLive();
  const [view, setView] = useState<ReturnType<typeof build> | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setView(
        build(
          session.workspace.id,
          session.workspace.type === "BUSINESS" ? session.workspace.name : "Seu dinheiro pessoal",
          session.user.plan,
          session.workspace.type === "BUSINESS",
        ),
      );
    })();
  }, [live]);

  if (!view) return null;
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs tracking-[0.14em] uppercase text-muted">Visão geral</p>
          <h1 className="text-2xl font-semibold mt-1 capitalize">{formatMonthLabel(view.month)}</h1>
          <p className="text-sm text-muted">
            {view.company
              ? `${view.label} — caixa da empresa. Títulos e DRE ficam no menu ao lado.`
              : `${view.label} — coloca os gastos e a planilha mostra o caixa e o que cortar.`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/importar" className="btn btn-primary">Colocar gastos</Link>
          <Link href="/app/lancamentos" className="btn btn-ink">Lançar na mão</Link>
        </div>
      </div>
      <MoneySheet sheet={view.sheet} />
      {!view.company ? (
      <section className="grid md:grid-cols-3 gap-3">
        {START_STEPS.map((step, index) => (
          <Link key={step.n} href={step.href} className={`card p-4 hover:border-gold rise rise-d${index + 1}`}>
            <div className="text-[11px] uppercase tracking-wide text-gold font-semibold">Passo {step.n}</div>
            <div className="font-semibold mt-1">{step.title}</div>
            <p className="text-sm text-muted mt-1">{step.body}</p>
          </Link>
        ))}
      </section>
      ) : null}
      {view.overdue ? (
        <div className="card p-4" style={{ background: "#f8e8e5" }}>
          <div className="font-semibold">{view.overdue} item(ns) atrasado(s) na agenda</div>
          <p className="text-sm text-muted mt-1">Abra a Agenda e lance o que já venceu para o saldo bater com a vida real.</p>
          <Link href="/app/agenda" className="btn btn-ghost mt-3">Ir para a agenda</Link>
        </div>
      ) : null}
      <AiInsights unlocked={view.ai} insights={view.insights} />
      <section className={`grid sm:grid-cols-2 ${view.company ? "xl:grid-cols-5" : "xl:grid-cols-3"} gap-4`}>
        <Metric label="Saldo atual" cents={view.projection.currentBalance} hint={view.deltaHint} />
        <Metric label={view.company ? "Receitas" : "Entrou"} cents={view.summary.income} tone="positive" />
        <Metric label={view.company ? "Despesas" : "Saiu"} cents={view.summary.expense} tone="negative" />
        {view.company ? (
          <>
            <Metric label="Quanto sobrou" value={`${view.savings}%`} hint="Do que entrou neste mês" />
            <Metric
              cents={view.projection.projectedBalance}
              label="Projeção de saldo"
              hint={view.projection.remainingRecurring ? "Inclui recorrentes que ainda não lançaram" : "Com o que já está no mês"}
            />
          </>
        ) : null}
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
            <h2 className="font-semibold">Agenda</h2>
            <Link href="/app/agenda" className="text-sm text-muted">Ver tudo</Link>
          </div>
          <ul className="space-y-2">
            {view.agenda.slice(0, 5).map((item) => (
              <li key={`${item.source}-${item.id}`} className="flex justify-between text-sm py-2 border-b border-line last:border-0">
                <span>
                  {item.description}
                  <span className="text-xs text-muted"> · {item.status === "overdue" ? "atrasado" : item.date.slice(8)} </span>
                </span>
                <span className={item.type === "INCOME" ? "text-positive" : "text-negative"}>{brl(item.amount)}</span>
              </li>
            ))}
            {!view.agenda.length ? <p className="text-sm text-muted">Nada a vencer. Cadastre um recorrente na Agenda.</p> : null}
          </ul>
        </div>
        {view.company ? (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">Tesouraria</h2>
              <Link href="/app/titulos" className="text-sm text-muted">Títulos</Link>
            </div>
            <p className="text-sm text-muted">
              A pagar {brl(view.bills.payables)} · a receber {brl(view.bills.receivables)}
              {view.bills.overduePay ? ` · atraso ${brl(view.bills.overduePay)}` : ""}
            </p>
          </div>
        ) : (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Meta</h2>
            <Link href="/app/metas" className="text-sm text-muted">Abrir</Link>
          </div>
          {view.goal ? (
            <div>
              <div className="font-medium">{view.goal.name}</div>
              <div className="text-sm text-muted mt-1">
                {brl(view.projection.currentBalance)} de {brl(view.goal.target)}
              </div>
              <div className="progress mt-3">
                <span style={{ width: `${view.goalPct}%` }} />
              </div>
              <p className="text-xs text-muted mt-2">{view.goalPct}% do alvo, com o saldo de agora.</p>
            </div>
          ) : (
            <p className="text-sm text-muted">Nenhuma meta ainda. No Grátis cabe 1.</p>
          )}
        </div>
        )}
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
                <span className="font-mono"><CountMoney cents={account.balance} /></span>
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

function build(workspaceId: string, label: string, plan: string, company: boolean) {
  const month = monthKey();
  const series = cashflowSeries(workspaceId);
  const agenda = monthAgenda(workspaceId, month);
  const projection = projectedCashflow(workspaceId, month);
  const summary = monthSummary(workspaceId, month);
  const goal = listGoals(workspaceId)[0] ?? null;
  return {
    month,
    label,
    company,
    ai: planHasAi(plan),
    ops: planHasOps(plan),
    insights: buildInsights(workspaceId, month),
    accounts: accountBalances(workspaceId),
    summary,
    series,
    categories: categorySpend(workspaceId, month),
    projection,
    agenda,
    overdue: agenda.filter((item) => item.status === "overdue").length,
    goal,
    goalPct: goal ? Math.min(100, Math.round((projection.currentBalance / Math.max(goal.target, 1)) * 100)) : 0,
    savings: summary.income > 0 ? Math.round((summary.net / summary.income) * 100) : 0,
    deltaHint: deltaHint(series),
    bills: billsOverview(workspaceId),
    sheet: buildMoneySheet(workspaceId),
  };
}

function deltaHint(series: ReturnType<typeof cashflowSeries>) {
  if (series.length < 2) return "Primeiro mês com dados";
  const prev = series[series.length - 2];
  const curr = series[series.length - 1];
  const diff = curr.net - prev.net;
  if (diff === 0) return "Mesmo resultado do mês passado";
  return diff > 0 ? `Melhor que o mês passado em ${brl(diff)}` : `Pior que o mês passado em ${brl(Math.abs(diff))}`;
}

function Metric({
  label,
  cents,
  value,
  hint,
  tone,
}: {
  label: string;
  cents?: number;
  value?: string;
  hint?: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="card p-5 rise">
      <div className="text-xs uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className={`text-2xl font-semibold mt-2 ${tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : ""}`}>
        {typeof cents === "number" ? <CountMoney cents={cents} /> : value}
      </div>
      {hint ? <div className="text-xs text-muted mt-1">{hint}</div> : null}
    </div>
  );
}
