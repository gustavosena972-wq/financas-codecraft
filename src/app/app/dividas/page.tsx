"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { brl, parseMoneyToCents } from "@/lib/money";
import { monthsToClearDebt } from "@/lib/tools";
import { netWorthSnapshot } from "@/lib/net-worth";

export default function DividasPage() {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [cards, setCards] = useState<{ name: string; balance: number }[]>([]);
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

  const cardDebt = cards.reduce((s, a) => s + Math.abs(a.balance), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Quitação</p>
        <h1 className="text-2xl font-semibold mt-1">Dívidas</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Planeja em quanto tempo cada dívida acaba. Cartão entra como passivo no patrimônio. Não é só relatório: você testa parcela e juro aqui.
        </p>
      </div>
      <article className="card p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Cartões neste espaço</div>
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
            Cadastre um cartão em <Link href="/app/contas" className="underline">Contas</Link> (tipo crédito) para aparecer no patrimônio.
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
