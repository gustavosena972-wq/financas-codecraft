"use client";

import { useEffect, useState } from "react";
import { listAccounts, listCategories, requireSession } from "@/lib/store";
import { brl, monthKey } from "@/lib/money";
import { TransactionForm } from "@/components/transaction-form";
import { deleteTransactionAction } from "@/app/actions/transactions";
import { go } from "@/lib/types";
import { monthSummary } from "@/lib/queries";

export default function TransactionsPage() {
  const [ready, setReady] = useState(false);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; kind: string }[]>([]);
  const [txs, setTxs] = useState<ReturnType<typeof monthSummary>["txs"]>([]);

  useEffect(() => {
    const session = requireSession();
    if (!session) {
      go("/login");
      return;
    }
    const month = monthKey();
    setAccounts(listAccounts(session.workspace.id));
    setCategories(listCategories(session.workspace.id));
    setTxs(monthSummary(session.workspace.id, month).txs);
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Lançamentos</h1>
        <p className="text-sm text-muted">Receitas, despesas e transferências internas.</p>
      </div>
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Novo lançamento</h2>
        <TransactionForm accounts={accounts} categories={categories} />
      </div>
      <div className="card overflow-x-auto">
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
            {txs.map((tx) => (
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
                  <button
                    className="text-xs text-muted"
                    onClick={async () => {
                      await deleteTransactionAction(tx.id);
                      window.location.reload();
                    }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
            {!txs.length ? (
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
