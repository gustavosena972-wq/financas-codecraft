"use client";

import { useEffect, useState } from "react";
import { listReconciledIds, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { accountBalances, monthSummary } from "@/lib/queries";
import { brl, formatMonthLabel, monthKey, parseMoneyToCents, shiftMonth } from "@/lib/money";
import { planHasOps } from "@/lib/plans";
import { toggleReconciledAction } from "@/app/actions/enterprise";
import { PageHeader, PlanGate } from "@/components/page-header";
import { go } from "@/lib/types";

export default function ConciliacaoPage() {
  const live = useLive();
  const [ops, setOps] = useState(false);
  const [month, setMonth] = useState(monthKey());
  const [accountId, setAccountId] = useState("");
  const [accounts, setAccounts] = useState<{ id: string; name: string; balance: number }[]>([]);
  const [txs, setTxs] = useState<ReturnType<typeof monthSummary>["txs"]>([]);
  const [done, setDone] = useState<string[]>([]);
  const [statement, setStatement] = useState("");

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOps(planHasOps(session.user.plan));
      const bals = accountBalances(session.workspace.id);
      setAccounts(bals);
      const current = accountId || bals[0]?.id || "";
      if (!accountId && bals[0]) setAccountId(bals[0].id);
      setTxs(monthSummary(session.workspace.id, month).txs.filter((t) => t.accountId === current || t.transferToAccountId === current));
      setDone(listReconciledIds(session.workspace.id));
    })();
  }, [live, month, accountId]);

  const book = accounts.find((a) => a.id === accountId)?.balance ?? 0;
  const pending = txs.filter((t) => !done.includes(t.id));
  const cents = parseMoneyToCents(statement) ?? 0;
  const diff = book - cents;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Análise"
        title="Conciliação"
        subtitle="Marque o que já bateu com o extrato do banco. A diferença entre o livro e o extrato aparece na hora."
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setMonth(shiftMonth(month, -1))}>Mês anterior</button>
            <button className="btn btn-ghost" onClick={() => setMonth(shiftMonth(month, 1))}>Próximo</button>
          </>
        }
      />
      <PlanGate allowed={ops} title="Conciliação entra no Empresa 200" body="Bater livro com banco é da empresa. Empresa 200." />
      {ops ? (
        <>
          <div className="grid sm:grid-cols-3 gap-3">
            <label className="field">
              <span>Conta</span>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <div className="card p-4">
              <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Saldo no app</div>
              <div className="text-xl font-semibold mt-1">{brl(book)}</div>
              <div className="text-xs text-muted capitalize">{formatMonthLabel(month)}</div>
            </div>
            <label className="field">
              <span>Saldo no extrato (centavos ou reais)</span>
              <input value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="igual ao banco" />
              {statement ? (
                <span className={diff === 0 ? "text-positive" : "text-negative"}>
                  {diff === 0 ? "Bateu" : `Diferença ${brl(diff)}`}
                </span>
              ) : null}
            </label>
          </div>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Conferido</th>
                </tr>
              </thead>
              <tbody>
                {txs.map((tx) => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
                    <td>{tx.description}</td>
                    <td>{brl(tx.amount)}</td>
                    <td>
                      <button
                        className="text-xs font-semibold"
                        onClick={async () => {
                          await toggleReconciledAction(tx.id);
                          setDone(listReconciledIds(tx.workspaceId));
                        }}
                      >
                        {done.includes(tx.id) ? "Sim" : "Marcar"}
                      </button>
                    </td>
                  </tr>
                ))}
                {!txs.length ? (
                  <tr>
                    <td colSpan={4} className="text-muted">Sem lançamentos nesta conta neste mês.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted">{pending.length} lançamento(s) ainda sem conferência.</p>
        </>
      ) : null}
    </div>
  );
}
