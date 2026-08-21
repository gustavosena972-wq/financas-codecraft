"use client";

import { useEffect, useState } from "react";
import { requireSession } from "@/lib/store";
import { brl } from "@/lib/money";
import { accountBalances } from "@/lib/queries";
import { archiveAccountAction, createAccountAction } from "@/app/actions/accounts";
import { ActionForm } from "@/components/action-form";
import { ACCOUNT_LABEL } from "@/lib/defaults";
import { go } from "@/lib/types";
import { listAccounts } from "@/lib/store";

export default function AccountsPage() {
  const [data, setData] = useState<ReturnType<typeof accountBalances>>([]);
  const [archived, setArchived] = useState(0);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setData(accountBalances(session.workspace.id));
      setArchived(listAccounts(session.workspace.id, true).filter((a) => a.archived).length);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contas e carteiras</h1>
        <p className="text-sm text-muted">Saldo inicial + lançamentos.</p>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {data.map((account) => (
          <article key={account.id} className="card p-5">
            <div className="text-xs text-muted uppercase tracking-wide">{ACCOUNT_LABEL[account.type]}</div>
            <h2 className="font-semibold mt-1">{account.name}</h2>
            <div className="text-2xl mt-3 font-semibold">{brl(account.balance)}</div>
            <button
              className="text-xs text-muted mt-4"
              onClick={async () => {
                await archiveAccountAction(account.id);
                window.location.reload();
              }}
            >
              Arquivar
            </button>
          </article>
        ))}
      </div>
      <div className="card p-6 max-w-lg">
        <h2 className="font-semibold mb-4">Nova conta</h2>
        <ActionForm action={createAccountAction} className="space-y-4" submitLabel="Criar conta">
          <label className="field">
            <span>Nome</span>
            <input name="name" required placeholder="Nubank, Caixa..." />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select name="type" defaultValue="CHECKING">
              <option value="CHECKING">Conta corrente</option>
              <option value="SAVINGS">Poupança</option>
              <option value="WALLET">Carteira</option>
              <option value="CASH">Caixa</option>
              <option value="CREDIT">Cartão</option>
            </select>
          </label>
          <label className="field">
            <span>Saldo inicial</span>
            <input name="initialBalance" placeholder="0,00" />
          </label>
        </ActionForm>
        {archived ? <p className="text-xs text-muted mt-4">{archived} conta(s) arquivada(s).</p> : null}
      </div>
    </div>
  );
}
