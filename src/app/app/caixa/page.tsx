"use client";

import { useEffect, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import { addBill, addMove, cashBalance, requireSession, settleBill, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, today } from "@/lib/types";
import { hasCash } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";

export default function CaixaPage() {
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
  const ok = hasCash(data.user.plan);
  const cash = cashBalance(data);

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Setor"
        title="Caixa"
        subtitle="O dinheiro da empresa. A IA avisa atraso e abre tarefa. Pagar ainda é o 5% — você confirma."
        extra={<div className={`text-2xl font-extrabold ${cash < 0 ? "text-negative" : ""}`}>{brl(cash)}</div>}
      />
      <Gate allowed={ok} title="Caixa entra no plano Empresa" body="No plano Empresa (R$ 305) você lança, cobra e baixa título. A IA não transfere sozinha." />
      {ok ? (
        <>
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
                  });
                  event.currentTarget.reset();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Não deu para lançar.");
                }
              }}
            >
              <h2 className="font-bold">Lançar</h2>
              <label className="field">
                <span>O que foi</span>
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
                    <option value="IN">Entrou</option>
                    <option value="OUT">Saiu</option>
                  </select>
                </label>
              </div>
              <label className="field">
                <span>Data</span>
                <input name="date" type="date" defaultValue={today()} />
              </label>
              <button className="btn btn-primary">Lançar no caixa</button>
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
              <h2 className="font-bold">A pagar / receber</h2>
              <label className="field">
                <span>Quem</span>
                <input name="party" required />
              </label>
              <label className="field">
                <span>O quê</span>
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
                <span>Vence</span>
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
                  <th>Quem</th>
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
                <Empty title="Caixa em silêncio" body="Lança o que entrou e o que ainda vai sair. A IA cuida do atraso." />
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
