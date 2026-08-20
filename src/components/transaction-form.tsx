"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { createTransactionAction } from "@/app/actions/transactions";

type Option = { id: string; name: string; kind?: string };

export function TransactionForm({
  accounts,
  categories,
}: {
  accounts: Option[];
  categories: Option[];
}) {
  const [type, setType] = useState("EXPENSE");
  const filtered = categories.filter((c) => {
    if (type === "TRANSFER") return false;
    if (type === "INCOME") return c.kind === "INCOME";
    return c.kind === "EXPENSE";
  });

  return (
    <ActionForm action={createTransactionAction} className="space-y-4" submitLabel="Lançar">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="field">
          <span>Tipo</span>
          <select name="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="EXPENSE">Despesa</option>
            <option value="INCOME">Receita</option>
            <option value="TRANSFER">Transferência</option>
          </select>
        </label>
        <label className="field">
          <span>Valor</span>
          <input name="amount" required placeholder="0,00" />
        </label>
        <label className="field">
          <span>Data</span>
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
      </div>
      <label className="field">
        <span>Descrição</span>
        <input name="description" required placeholder="Ex: Supermercado" />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="field">
          <span>{type === "TRANSFER" ? "Saiu de" : "Conta"}</span>
          <select name="accountId" required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </label>
        {type === "TRANSFER" ? (
          <label className="field">
            <span>Entrou em</span>
            <select name="transferToAccountId">
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span>Categoria</span>
            <select name="categoryId">
              <option value="">Sem categoria</option>
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <label className="field">
        <span>Observações</span>
        <textarea name="notes" rows={2} />
      </label>
    </ActionForm>
  );
}
