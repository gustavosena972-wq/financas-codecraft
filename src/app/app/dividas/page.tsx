"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { formatMonthLabel, brl, parseMoneyToCents } from "@/lib/money";
import { cardEvolution, cardMetaFromTotals } from "@/lib/family-budget";
import { familyOutlook } from "@/lib/family-forecast";
import { monthsToClearDebt } from "@/lib/tools";
import { netWorthSnapshot } from "@/lib/net-worth";

export default function DividasPage() {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [cards, setCards] = useState<{ name: string; balance: number }[]>([]);
  const [evo, setEvo] = useState<ReturnType<typeof cardEvolution> | null>(null);
  const [cutExtra, setCutExtra] = useState(0);
  const [debt, setDebt] = useState({ principal: "5000", pay: "400", rate: "2,5" });

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      const worth = netWorthSnapshot(session.workspace.id);
      setCards(worth.accounts.filter((a) => a.type === "CREDIT").map((a) => ({ name: a.name, balance: a.balance })));
      setEvo(cardEvolution(session.workspace.id));
      setCutExtra(familyOutlook(session.workspace.id).cutPath.extra);
      setReady(true);
    })();
  }, [live]);

  const result = useMemo(() => {
    const principal = parseMoneyToCents(debt.principal) ?? 0;
    const pay = parseMoneyToCents(debt.pay) ?? 0;
    const rate = Number(String(debt.rate).replace(",", "."));
    return monthsToClearDebt(principal, pay, Number.isFinite(rate) ? rate : 0);
  }, [debt]);

  if (!ready) return null;

  const meta = evo ? cardMetaFromTotals(evo.totals) : null;
  const cardDebt = cards.reduce((s, a) => s + Math.abs(a.balance), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Cartões</p>
        <h1 className="text-2xl font-semibold mt-1">Evolução dos cartões</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Cada cartão, mês a mês. O trabalho não é olhar a tabela — é baixar a fatura. Se cair 10% ao mês daqui pra frente
          {cutExtra > 5000 ? `, sobra mais ${brl(cutExtra)} no ano` : ""}. Sem parcela nova.
        </p>
      </div>
      {evo && evo.cards.length ? (
        <article className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Cartão</th>
                {evo.months.map((month) => (
                  <th key={month}>{formatMonthLabel(month).slice(0, 3)}</th>
                ))}
                <th>Ano</th>
              </tr>
            </thead>
            <tbody>
              {evo.cards.map((card) => (
                <tr key={card.name}>
                  <td>{card.name}</td>
                  {card.values.map((value, i) => (
                    <td key={evo.months[i]}>{value ? brl(value) : "—"}</td>
                  ))}
                  <td>{brl(card.total)}</td>
                </tr>
              ))}
              <tr>
                <td>Real</td>
                {evo.totals.map((value, i) => (
                  <td key={evo.months[i]}>{value ? brl(value) : "—"}</td>
                ))}
                <td>{brl(evo.totals.reduce((s, n) => s + n, 0))}</td>
              </tr>
              {meta ? (
                <tr>
                  <td>Meta (−{Math.round(meta.cutPct * 100)}%)</td>
                  {meta.values.map((value, i) => (
                    <td key={evo.months[i]} className={value && evo.totals[i] > value ? "text-negative" : ""}>
                      {value ? brl(value) : "—"}
                    </td>
                  ))}
                  <td>—</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </article>
      ) : (
        <article className="card p-5">
          <p className="text-sm text-muted">
            Manda a planilha da casa em <Link href="/app/importar" className="underline">Mandar planilha</Link> para ver Nubank, Inter e os outros mês a mês.
          </p>
        </article>
      )}
      <article className="card p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Saldo em contas de crédito</div>
        <div className="text-3xl font-semibold mt-1">{brl(cardDebt)}</div>
        {cards.length ? (
          <ul className="text-sm mt-3 space-y-1">
            {cards.map((card) => (
              <li key={card.name}>
                {card.name}: {brl(Math.abs(card.balance))}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted mt-2">
            Se quiser o saldo do plástico separado, cadastre o cartão em <Link href="/app/contas" className="underline">Contas</Link> (tipo crédito).
          </p>
        )}
      </article>
      <article className="card p-5 space-y-3">
        <h2 className="font-semibold">Quando acaba</h2>
        <p className="text-sm text-muted">Saldo, parcela e juro ao mês. Cartão costuma ser o juro mais alto — quite o rotativo primeiro.</p>
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
        {"error" in result ? (
          <p className="text-sm text-negative">{result.error}</p>
        ) : (
          <p className="text-sm">
            Fecha em {result.months} mês(es). Juro total {brl(result.interest)}.
          </p>
        )}
      </article>
    </div>
  );
}
