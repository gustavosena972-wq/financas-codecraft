"use client";

import { useEffect, useMemo, useState } from "react";
import { listAccounts, listCategories, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl, formatMonthLabel, monthKey, shiftMonth } from "@/lib/money";
import { TransactionForm } from "@/components/transaction-form";
import { deleteTransactionAction, duplicateTransactionAction } from "@/app/actions/transactions";
import { go } from "@/lib/types";
import { monthSummary } from "@/lib/queries";
import { planHasAi } from "@/lib/plans";

export default function TransactionsPage() {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; kind: string }[]>([]);
  const [txs, setTxs] = useState<ReturnType<typeof monthSummary>["txs"]>([]);
  const [month, setMonth] = useState(monthKey());
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("ALL");
  const [workspaceId, setWorkspaceId] = useState("");

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setWorkspaceId(session.workspace.id);
      setAccounts(listAccounts(session.workspace.id));
      setCategories(listCategories(session.workspace.id));
      setAiEnabled(planHasAi(session.user.plan));
      setReady(true);
    })();
  }, [live]);

  useEffect(() => {
    if (!workspaceId) return;
    setTxs(monthSummary(workspaceId, month).txs);
  }, [workspaceId, month, live]);

  const filtered = useMemo(() => {
    return txs.filter((tx) => {
      if (kind !== "ALL" && tx.type !== kind) return false;
      if (!q.trim()) return true;
      const hay = `${tx.description} ${tx.category?.name ?? ""} ${tx.account.name}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [txs, q, kind]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lançar na mão</h1>
        <p className="text-sm text-muted">Uma linha por gasto. Também pode falar no chat ou mandar a planilha pelo clipe.</p>
      </div>
      <div className="flex flex-wrap gap-2 items-end">
        <label className="field">
          <span>Buscar</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="descrição, categoria, conta" />
        </label>
        <label className="field">
          <span>Tipo</span>
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="ALL">Tudo</option>
            <option value="INCOME">Receitas</option>
            <option value="EXPENSE">Despesas</option>
            <option value="TRANSFER">Transferências</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button className="btn btn-ghost" onClick={() => setMonth(shiftMonth(month, -1))}>Mês anterior</button>
          <button className="btn btn-ghost" onClick={() => setMonth(shiftMonth(month, 1))}>Próximo</button>
        </div>
        <div className="text-sm text-muted pb-2 capitalize">{formatMonthLabel(month)}</div>
      </div>
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Novo lançamento</h2>
        <TransactionForm accounts={accounts} categories={categories} aiEnabled={aiEnabled} />
      </div>
      <div className="card overflow-x-auto">
        <div className="flex flex-wrap gap-4 px-4 pt-4 text-sm">
          <span>Receitas <strong className="text-positive">{brl(filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0))}</strong></span>
          <span>Despesas <strong className="text-negative">{brl(filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0))}</strong></span>
          <span className="text-muted">{filtered.length} lançamento(s)</span>
        </div>
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Conta</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((tx) => (
              <tr key={tx.id}>
                <td className="whitespace-nowrap">{new Date(tx.date).toLocaleDateString("pt-BR")}</td>
                <td>{tx.description}</td>
                <td>{tx.category?.name ?? (tx.type === "TRANSFER" ? "Transferência" : "—")}</td>
                <td>{tx.account.name}</td>
                <td className={tx.type === "INCOME" ? "text-positive" : tx.type === "EXPENSE" ? "text-negative" : ""}>
                  {tx.type === "INCOME" ? "+" : tx.type === "EXPENSE" ? "−" : ""}
                  {brl(tx.amount)}
                </td>
                <td>
                  <div className="flex gap-2 justify-end">
                    <button
                      className="text-xs text-muted"
                      onClick={async () => {
                        await duplicateTransactionAction(tx.id);
                        setTxs(monthSummary(workspaceId, month).txs);
                      }}
                    >
                      Copiar
                    </button>
                    <button
                      className="text-xs text-muted"
                      onClick={async () => {
                        await deleteTransactionAction(tx.id);
                        setTxs(monthSummary(workspaceId, month).txs);
                      }}
                    >
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length ? (
              <tr>
                <td colSpan={6} className="text-muted">Nenhum lançamento neste mês.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
