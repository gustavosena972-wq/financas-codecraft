"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { brl, formatMonthLabel, monthKey, parseMoneyToCents } from "@/lib/money";
import { accountBalances, cashflowSeries, categorySpend, monthSummary } from "@/lib/queries";
import { billsOverview } from "@/lib/ops";
import { financePulse } from "@/lib/accountant";
import { workspaceToolsPaid } from "@/lib/plans";
import {
  bucketSpend,
  cutSave,
  housingCap,
  monthsToClearDebt,
  reserveHint,
  reserveMonths,
  sellPrice,
  split503020,
} from "@/lib/tools";

type View = {
  company: boolean;
  paid: boolean;
  pulse: ReturnType<typeof financePulse>;
  income: number;
  expense: number;
  balance: number;
  moradia: number;
  spend: ReturnType<typeof categorySpend>;
  series: ReturnType<typeof cashflowSeries>;
  bills: ReturnType<typeof billsOverview>;
};

export default function FerramentasPage() {
  const live = useLive();
  const [view, setView] = useState<View | null>(null);
  const [cutPct, setCutPct] = useState(20);
  const [debt, setDebt] = useState({ principal: "5000", pay: "400", rate: "2,5" });
  const [price, setPrice] = useState({ cost: "800", tax: "16", margin: "30" });

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      const id = session.workspace.id;
      const month = monthKey();
      const now = monthSummary(id, month);
      const spendNow = categorySpend(id, month);
      const accounts = accountBalances(id);
      const balance = accounts.reduce((s, a) => s + a.balance, 0);
      setView({
        company: session.workspace.type === "BUSINESS",
        paid: workspaceToolsPaid(session.user.plan, session.workspace.type === "BUSINESS"),
        pulse: financePulse(id),
        income: now.income,
        expense: now.expense,
        balance,
        moradia: spendNow.find((s) => /moradia|aluguel/i.test(s.name))?.amount ?? 0,
        spend: spendNow,
        series: cashflowSeries(id, 6),
        bills: billsOverview(id),
      });
    })();
  }, [live]);

  const split = view ? split503020(view.income) : null;
  const buckets = view ? bucketSpend(view.spend) : null;
  const essential = view ? (buckets && buckets.need > 0 ? buckets.need : Math.round(view.expense * 0.7)) : 0;
  const months = view ? reserveMonths(view.balance, essential) : null;
  const cap = view ? housingCap(view.income) : 0;
  const topCuts = view
    ? view.spend.slice(0, 3).map((row) => ({ ...row, save: cutSave(row.amount, cutPct) }))
    : [];
  const cutTotal = topCuts.reduce((s, r) => s + r.save, 0);

  const debtResult = useMemo(() => {
    const principal = parseMoneyToCents(debt.principal) ?? 0;
    const pay = parseMoneyToCents(debt.pay) ?? 0;
    const rate = Number(String(debt.rate).replace(",", "."));
    return monthsToClearDebt(principal, pay, Number.isFinite(rate) ? rate : 0);
  }, [debt]);

  const priceResult = useMemo(() => {
    const cost = parseMoneyToCents(price.cost) ?? 0;
    const tax = Number(String(price.tax).replace(",", "."));
    const margin = Number(String(price.margin).replace(",", "."));
    return sellPrice(cost, Number.isFinite(tax) ? tax : 0, Number.isFinite(margin) ? margin : 0);
  }, [price]);

  if (!view) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Ferramentas</p>
        <h1 className="text-2xl font-semibold mt-1">Contas que ajudam a decidir</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Usam o que já está no seu espaço. O chat explica; aqui você testa o número. Educação financeira fica em{" "}
          <Link href="/app/educacao" className="underline">
            Educação
          </Link>
          .
        </p>
      </div>

      <section className="grid sm:grid-cols-3 gap-4">
        <article className="card p-5">
          <div className="text-xs uppercase tracking-wide text-muted font-semibold">Situação</div>
          <div className={`text-2xl font-semibold mt-2 health-inline ${view.pulse.level}`}>{view.pulse.label}</div>
          <p className="text-sm text-muted mt-2">{view.pulse.hint}</p>
        </article>
        <article className="card p-5">
          <div className="text-xs uppercase tracking-wide text-muted font-semibold">Reserva</div>
          <div className="text-2xl font-semibold mt-2">
            {months == null ? "—" : `${months.toFixed(1)} mês(es)`}
          </div>
          <p className="text-sm text-muted mt-2">{reserveHint(months)}</p>
        </article>
        <article className="card p-5">
          <div className="text-xs uppercase tracking-wide text-muted font-semibold">Neste mês</div>
          <div className="text-2xl font-semibold mt-2">{brl(view.income - view.expense)}</div>
          <p className="text-sm text-muted mt-2">
            Entrou {brl(view.income)} · saiu {brl(view.expense)} · saldo {brl(view.balance)}
          </p>
        </article>
      </section>

      <section className="card p-5">
        <h2 className="font-semibold">Meses passados</h2>
        <p className="text-sm text-muted mt-1">Média real, não o mês bom. Use isso para o teto da frente.</p>
        <div className="overflow-x-auto mt-4">
          <table className="table">
            <thead>
              <tr>
                <th>Mês</th>
                <th>Entrou</th>
                <th>Saiu</th>
                <th>Sobra</th>
              </tr>
            </thead>
            <tbody>
              {view.series.map((row) => (
                <tr key={row.month}>
                  <td className="capitalize">{formatMonthLabel(row.month)}</td>
                  <td>{brl(row.income)}</td>
                  <td>{brl(row.expense)}</td>
                  <td className={row.net < 0 ? "text-negative" : "text-positive"}>{brl(row.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Gate allowed={view.paid} company={view.company}>
        <section className="grid lg:grid-cols-2 gap-4">
          <article className="card p-5 space-y-3">
            <h2 className="font-semibold">50-30-20 no seu mês</h2>
            {split && buckets ? (
              <>
                <p className="text-sm text-muted">Do que entrou, o teto saudável e o que realmente saiu.</p>
                <ul className="text-sm space-y-2">
                  <li>Essencial: teto {brl(split.need)} · real {brl(buckets.need)}</li>
                  <li>Escolha (lazer/assinatura): teto {brl(split.want)} · real {brl(buckets.want)}</li>
                  <li>Reserva/dívida: teto {brl(split.save)} · o resto do mês foi {brl(Math.max(0, view.income - view.expense))}</li>
                </ul>
              </>
            ) : (
              <p className="text-sm text-muted">Lance o que entra para fechar esta conta.</p>
            )}
          </article>

          <article className="card p-5 space-y-3">
            <h2 className="font-semibold">E se cortar {cutPct}% do que mais pesa?</h2>
            <input type="range" min={5} max={40} value={cutPct} onChange={(e) => setCutPct(Number(e.target.value))} />
            {topCuts.length ? (
              <ul className="text-sm space-y-1">
                {topCuts.map((row) => (
                  <li key={row.name}>
                    {row.name}: hoje {brl(row.amount)} · corta {brl(row.save)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Ainda não tem gasto neste mês.</p>
            )}
            <p className="text-sm">
              Economia {brl(cutTotal)} / mês. O mês passaria a sair {brl(Math.max(0, view.expense - cutTotal))}.
            </p>
          </article>
        </section>

        <section className="grid lg:grid-cols-2 gap-4">
          <article className="card p-5 space-y-3">
            <h2 className="font-semibold">Moradia em 30%</h2>
            {view.income > 0 ? (
              <p className="text-sm">
                Teto saudável: {brl(cap)}. Hoje moradia está em {brl(view.moradia)}.
                {view.moradia > cap
                  ? ` Passou ${brl(view.moradia - cap)}. Negocie aluguel ou extra do condomínio — não cancela a casa.`
                  : " Está dentro. Segure esse teto na renovação."}
              </p>
            ) : (
              <p className="text-sm text-muted">Falta a renda do mês para fechar o teto de 30%.</p>
            )}
          </article>

          <article className="card p-5 space-y-3">
            <h2 className="font-semibold">Quando a dívida acaba</h2>
            <p className="text-sm text-muted">Parcela, juro ao mês (cartão costuma ser alto) e o saldo de hoje.</p>
            <div className="grid grid-cols-3 gap-2">
              <label className="field">
                <span>Dívida</span>
                <input value={debt.principal} onChange={(e) => setDebt({ ...debt, principal: e.target.value })} />
              </label>
              <label className="field">
                <span>Parcela</span>
                <input value={debt.pay} onChange={(e) => setDebt({ ...debt, pay: e.target.value })} />
              </label>
              <label className="field">
                <span>% ao mês</span>
                <input value={debt.rate} onChange={(e) => setDebt({ ...debt, rate: e.target.value })} />
              </label>
            </div>
            {"error" in debtResult ? (
              <p className="text-sm text-negative">{debtResult.error}</p>
            ) : (
              <p className="text-sm">
                Fecha em {debtResult.months} mês(es). Juro total {brl(debtResult.interest)}. Se o juro for de cartão, quite o rotativo primeiro.
              </p>
            )}
          </article>
        </section>
      </Gate>

      {view.company ? (
        <Gate allowed={view.paid} company>
          <section className="grid lg:grid-cols-2 gap-4">
            <article className="card p-5 space-y-2">
              <h2 className="font-semibold">Giro da tesouraria</h2>
              <p className="text-sm">
                A pagar {brl(view.bills.payables)} · a receber {brl(view.bills.receivables)}.
                {view.bills.overduePay ? ` Atraso a pagar ${brl(view.bills.overduePay)}.` : ""}
                {view.bills.overdueRec ? ` Cliente atrasado ${brl(view.bills.overdueRec)}.` : ""}
              </p>
              <p className="text-sm text-muted">
                Título a receber não é caixa. Não gaste o que ainda não caiu. Cobre o atraso antes de cortar folha.
              </p>
            </article>
            <article className="card p-5 space-y-3">
              <h2 className="font-semibold">Precificar um serviço</h2>
              <div className="grid grid-cols-3 gap-2">
                <label className="field">
                  <span>Custo</span>
                  <input value={price.cost} onChange={(e) => setPrice({ ...price, cost: e.target.value })} />
                </label>
                <label className="field">
                  <span>Imposto %</span>
                  <input value={price.tax} onChange={(e) => setPrice({ ...price, tax: e.target.value })} />
                </label>
                <label className="field">
                  <span>Margem %</span>
                  <input value={price.margin} onChange={(e) => setPrice({ ...price, margin: e.target.value })} />
                </label>
              </div>
              {"error" in priceResult ? (
                <p className="text-sm text-negative">{priceResult.error}</p>
              ) : (
                <p className="text-sm">
                  Cobrar {brl(priceResult.price)}. Imposto {brl(priceResult.tax)}, margem {brl(priceResult.margin)}. À vista no PIX fecha melhor quando o juro está alto.
                </p>
              )}
            </article>
          </section>
        </Gate>
      ) : null}

      <p className="text-sm text-muted">
        Quer o raciocínio, não só a conta?{" "}
        <Link href="/app" className="underline">
          Volta ao chat
        </Link>
        .
      </p>
    </div>
  );
}

function Gate({ allowed, company, children }: { allowed: boolean; company?: boolean; children: React.ReactNode }) {
  if (allowed) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none opacity-40">{children}</div>
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="card p-5 max-w-md text-center space-y-3">
          <p className="font-semibold">{company ? "No plano Empresa" : "No plano Pessoal"}</p>
          <p className="text-sm text-muted">
            {company
              ? "Giro, preço e DRE entram no Empresa 100 (R$ 100) ou 200 (R$ 200)."
              : "50-30-20, corte e moradia entram no Pessoa 100 (R$ 100) ou 200 (R$ 200)."}
          </p>
          <Link href="/app/planos" className="btn btn-primary">
            Ver planos
          </Link>
        </div>
      </div>
    </div>
  );
}
