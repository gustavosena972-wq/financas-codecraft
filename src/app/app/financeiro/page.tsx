"use client";

import { useEffect, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import { addBill, addMove, cashBalance, dreSummary, requireSession, settleBill, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, today } from "@/lib/types";
import { hasFinance } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";

export default function FinanceiroPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;
  const ok = hasFinance(data.user);
  const cash = cashBalance(data);
  const dre = dreSummary(data);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Módulo"
        title="Financeiro"
        subtitle="Caixa, contas a pagar e a receber, e DRE gerencial da empresa."
        extra={<div className={`text-2xl font-extrabold ${cash < 0 ? "text-negative" : ""}`}>{brl(cash)}</div>}
      />
      <Gate allowed={ok} title="Assine para abrir o financeiro" body="Planos de R$ 280 a R$ 500. Com cartão cadastrado a renovação é automática." />
      {ok ? (
        <>
          <div className="grid sm:grid-cols-3 gap-4">
            <article className="card p-4">
              <p className="kicker">Receitas</p>
              <p className="text-xl font-extrabold text-positive mt-1">{brl(dre.revenue)}</p>
            </article>
            <article className="card p-4">
              <p className="kicker">Despesas</p>
              <p className="text-xl font-extrabold text-negative mt-1">{brl(dre.expense)}</p>
            </article>
            <article className="card p-4">
              <p className="kicker">Resultado</p>
              <p className={`text-xl font-extrabold mt-1 ${dre.result < 0 ? "text-negative" : ""}`}>{brl(dre.result)}</p>
            </article>
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <form
              className="card p-6 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setError("");
                const form = new FormData(event.currentTarget);
                const amount = parseMoneyToCents(String(form.get("amount") ?? ""));
                if (amount == null || !data.wallets[0]) {
                  setError("Valor ou conta faltando.");
                  return;
                }
                try {
                  await addMove({
                    walletId: data.wallets[0].id,
                    type: String(form.get("type")) === "OUT" ? "OUT" : "IN",
                    amount: Math.abs(amount),
                    date: String(form.get("date") || today()),
                    description: String(form.get("description")),
                    category: String(form.get("category") || "Geral"),
                    costCenter: String(form.get("costCenter") || "Geral"),
                  });
                  event.currentTarget.reset();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Não deu para lançar.");
                }
              }}
            >
              <h2 className="font-bold">Lançar no caixa</h2>
              <label className="field">
                <span>Descrição</span>
                <input name="description" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  <span>Valor</span>
                  <input name="amount" required />
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select name="type">
                    <option value="IN">Entrada</option>
                    <option value="OUT">Saída</option>
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  <span>Categoria</span>
                  <input name="category" placeholder="Geral" />
                </label>
                <label className="field">
                  <span>Centro de custo</span>
                  <input name="costCenter" placeholder="Geral" />
                </label>
              </div>
              <label className="field">
                <span>Data</span>
                <input name="date" type="date" defaultValue={today()} />
              </label>
              <button className="btn btn-primary">Lançar</button>
              {error ? <p className="text-sm text-negative">{error}</p> : null}
            </form>

            <form
              className="card p-6 grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const amount = parseMoneyToCents(String(form.get("amount") ?? ""));
                if (amount == null) return;
                await addBill({
                  kind: String(form.get("kind")) === "GET" ? "GET" : "PAY",
                  party: String(form.get("party")),
                  description: String(form.get("description")),
                  amount: Math.abs(amount),
                  due: String(form.get("due") || today()),
                  status: "OPEN",
                });
                event.currentTarget.reset();
              }}
            >
              <h2 className="font-bold">Títulos a pagar / receber</h2>
              <label className="field">
                <span>Parceiro</span>
                <input name="party" required />
              </label>
              <label className="field">
                <span>Descrição</span>
                <input name="description" required />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  <span>Valor</span>
                  <input name="amount" required />
                </label>
                <label className="field">
                  <span>Tipo</span>
                  <select name="kind">
                    <option value="PAY">A pagar</option>
                    <option value="GET">A receber</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Vencimento</span>
                <input name="due" type="date" required />
              </label>
              <button className="btn btn-ink">Abrir título</button>
            </form>
          </div>

          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Parceiro</th>
                  <th>Vence</th>
                  <th>Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {data.bills.map((bill) => (
                  <tr key={bill.id}>
                    <td>
                      {bill.kind === "PAY" ? "Pagar" : "Receber"} · {bill.description}
                    </td>
                    <td>{bill.party}</td>
                    <td>{bill.due}</td>
                    <td className={bill.kind === "PAY" ? "text-negative" : "text-positive"}>{brl(bill.amount)}</td>
                    <td>
                      {bill.status === "OPEN" ? (
                        <button className="btn btn-primary" type="button" onClick={() => void settleBill(bill.id)}>
                          Baixar
                        </button>
                      ) : (
                        <span className="chip ok">baixado</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!data.bills.length && !data.moves.length ? (
              <div className="p-4">
                <Empty title="Financeiro quieto" body="Lance entradas e saídas, e abra títulos a pagar ou receber." />
              </div>
            ) : null}
          </div>

          {data.moves.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Descrição</th>
                    <th>Centro</th>
                    <th>Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {data.moves.slice(0, 40).map((move) => (
                    <tr key={move.id}>
                      <td>{move.date}</td>
                      <td>
                        {move.description}
                        <div className="text-xs text-muted">{move.category}</div>
                      </td>
                      <td>{move.costCenter}</td>
                      <td className={move.type === "OUT" ? "text-negative" : "text-positive"}>
                        {move.type === "OUT" ? "−" : "+"}
                        {brl(move.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
