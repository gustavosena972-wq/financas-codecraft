"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { brl } from "@/lib/money";
import type { buildMoneySheet } from "@/lib/coach";
import { CountMoney } from "@/components/count-up";

const TIPS_KEY = "fc-cut-tips";

export function MoneySheet({ sheet }: { sheet: ReturnType<typeof buildMoneySheet> }) {
  const [done, setDone] = useState<string[]>([]);
  const [openTip, setOpenTip] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    try {
      setDone(JSON.parse(localStorage.getItem(TIPS_KEY) || "[]"));
    } catch {
      setDone([]);
    }
  }, []);

  function toggleTip(title: string) {
    const next = done.includes(title) ? done.filter((t) => t !== title) : [title, ...done];
    setDone(next);
    localStorage.setItem(TIPS_KEY, JSON.stringify(next.slice(0, 20)));
  }

  if (sheet.empty) {
    return (
      <section className="card p-6 rise">
        <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">Sua planilha</p>
        <h2 className="text-xl font-semibold mt-1">Coloca os gastos. A IA monta o controle.</h2>
        <p className="text-sm text-muted mt-2 max-w-2xl">
          Manda o Excel do computador ou lança na mão. Daí aparece o caixa, o que você deve gastar nos próximos meses
          e o que dá para cortar.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href="/app/importar" className="btn btn-primary">
            Mandar planilha
          </Link>
          <Link href="/app/lancamentos" className="btn btn-ghost">
            Lançar na mão
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="card overflow-hidden rise">
      <div className="p-5 pb-3 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">Sua planilha</p>
          <h2 className="font-semibold mt-1">Caixa, futuro e o que cortar</h2>
          <p className="text-sm text-muted mt-1">Toque no mês para destacar. Toque na dica para marcar que vai cortar.</p>
        </div>
        {sheet.saveMonth ? (
          <div className="text-right">
            <div className="text-xs uppercase tracking-wide text-muted font-semibold">Se seguir as dicas</div>
            <div className="text-xl font-semibold text-positive mt-1">
              <CountMoney cents={sheet.saveMonth} /> / mês
            </div>
            <div className="text-xs text-muted">
              <CountMoney cents={sheet.yearSave} /> no ano
            </div>
          </div>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Mês</th>
              <th>Entra</th>
              <th>Sai</th>
              <th>Sobra</th>
              <th>Saldo</th>
            </tr>
          </thead>
          <tbody>
            {sheet.rows.map((row) => {
              const on = picked === row.month || (!picked && row.kind === "now");
              return (
                <tr
                  key={row.month}
                  className={`sheet-row ${row.kind === "now" ? "sheet-now" : ""} ${on ? "sheet-on" : ""}`}
                  onClick={() => setPicked(row.month)}
                >
                  <td className="capitalize">
                    {row.label}
                    <div className="text-[11px] text-muted">
                      {row.kind === "past" ? "realizado" : row.kind === "now" ? "este mês" : "previsão"}
                    </div>
                  </td>
                  <td className="text-positive">{row.income ? brl(row.income) : "—"}</td>
                  <td className="text-negative">{row.expense ? brl(row.expense) : "—"}</td>
                  <td className={row.net >= 0 ? "text-positive" : "text-negative"}>{brl(row.net)}</td>
                  <td>{row.kind === "past" ? "—" : brl(row.balance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {sheet.tips.length ? (
        <div className="p-5 pt-4 border-t border-line grid md:grid-cols-2 gap-3">
          {sheet.tips.map((tip) => {
            const marked = done.includes(tip.title);
            const open = openTip === tip.title;
            return (
              <article
                key={tip.title}
                className={`rounded-lg bg-bg p-4 tip-card ${marked ? "tip-done" : ""} ${open ? "tip-open" : ""}`}
              >
                <button type="button" className="w-full text-left" onClick={() => setOpenTip(open ? null : tip.title)}>
                  <h3 className="font-semibold text-sm">{tip.title}</h3>
                  <p className="text-sm text-muted mt-1">{tip.body}</p>
                  {tip.save ? <p className="text-xs text-positive font-semibold mt-2">Alívio {brl(tip.save)} / mês</p> : null}
                </button>
                <button
                  type="button"
                  className={`btn mt-3 ${marked ? "btn-ink" : "btn-ghost"}`}
                  onClick={() => toggleTip(tip.title)}
                >
                  {marked ? "Vou cortar ✓" : "Vou cortar isso"}
                </button>
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
