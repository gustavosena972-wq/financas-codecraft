"use client";

import { useEffect, useState } from "react";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl } from "@/lib/money";
import { accountBalances } from "@/lib/queries";
import { archiveAccountAction, createAccountAction } from "@/app/actions/accounts";
import { ActionForm } from "@/components/action-form";
import { ACCOUNT_LABEL } from "@/lib/defaults";
import { go } from "@/lib/types";
import { listAccounts, listBankLinks } from "@/lib/store";
import { BankConnect } from "@/components/bank-connect";

const HOUSE_LABEL: Record<string, string> = {
  CHECKING: "Banco",
  SAVINGS: "Banco / poupança",
  WALLET: "Dinheiro na mão",
  CASH: "Dinheiro na mão",
  CREDIT: "Cartão",
};

export default function AccountsPage() {
  const live = useLive();
  const [data, setData] = useState<ReturnType<typeof accountBalances>>([]);
  const [archived, setArchived] = useState(0);
  const [company, setCompany] = useState(false);
  const [banks, setBanks] = useState<string[]>([]);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setCompany(session.workspace.type === "BUSINESS");
      setData(accountBalances(session.workspace.id));
      setArchived(listAccounts(session.workspace.id, true).filter((a) => a.archived).length);
      setBanks(listBankLinks(session.workspace.id).map((item) => item.name));
    })();
  }, [live]);

  if (!company) {
    return (
      <div className="space-y-5 max-w-2xl">
        <div>
          <p className="page-kicker">Lugares do dinheiro</p>
          <h1 className="text-2xl font-semibold">Onde está</h1>
          <p className="text-sm text-muted mt-1">Só três ideias: banco, dinheiro na mão e cartão. O número é quanto tem agora nesse lugar.</p>
        </div>
        <BankConnect selected={banks} />
        <div className="space-y-3">
          {data.map((account) => (
            <article key={account.id} className="card p-5">
              <p className="text-xs text-muted uppercase tracking-wide">{HOUSE_LABEL[account.type] ?? ACCOUNT_LABEL[account.type]}</p>
              <div className="flex justify-between gap-4 items-baseline mt-1">
                <h2 className="font-semibold">{account.name}</h2>
                <p className={`text-2xl font-semibold ${account.type === "CREDIT" && account.balance < 0 ? "text-negative" : ""}`}>
                  {brl(account.balance)}
                </p>
              </div>
              <p className="text-sm text-muted mt-2">
                {account.type === "CREDIT" ? "Quanto o cartão está devendo." : "Quanto tem nesse lugar agora."}
              </p>
              <button
                className="text-xs text-muted mt-3"
                onClick={async () => {
                  await archiveAccountAction(account.id);
                }}
              >
                Esconder
              </button>
            </article>
          ))}
          {!data.length ? <p className="text-sm text-muted">Ainda não tem nenhum lugar. Cria o primeiro embaixo.</p> : null}
        </div>
        <article className="card p-6">
          <h2 className="font-semibold mb-1">Novo lugar</h2>
          <p className="text-sm text-muted mb-4">Nome, o tipo, e quanto tem agora.</p>
          <ActionForm action={createAccountAction} className="space-y-4" submitLabel="Guardar">
            <label className="field">
              <span>Nome</span>
              <input name="name" required placeholder="Nubank, Inter, carteira..." />
            </label>
            <label className="field">
              <span>Que tipo é</span>
              <select name="type" defaultValue="CHECKING">
                <option value="CHECKING">Banco</option>
                <option value="WALLET">Dinheiro na mão</option>
                <option value="CREDIT">Cartão</option>
              </select>
            </label>
            <label className="field">
              <span>Quanto tem agora</span>
              <input name="initialBalance" placeholder="0,00" />
            </label>
          </ActionForm>
          {archived ? <p className="text-xs text-muted mt-4">{archived} lugar(es) escondido(s).</p> : null}
        </article>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Contas e carteiras</h1>
        <p className="text-sm text-muted max-w-2xl">Onde o caixa da empresa está.</p>
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
