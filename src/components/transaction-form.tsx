"use client";

import { useState } from "react";
import { ActionForm } from "@/components/action-form";
import { createTransactionAction } from "@/app/actions/transactions";
import { suggestCategory } from "@/lib/ai";

type Option = { id: string; name: string; kind?: string };

export function TransactionForm({
  accounts,
  categories,
  aiEnabled = false,
  simple = false,
}: {
  accounts: Option[];
  categories: Option[];
  aiEnabled?: boolean;
  simple?: boolean;
}) {
  const [type, setType] = useState("EXPENSE");
  const [categoryId, setCategoryId] = useState("");
  const [pickedManually, setPickedManually] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const filtered = categories.filter((c) => {
    if (type === "TRANSFER") return false;
    if (type === "INCOME") return c.kind === "INCOME";
    return c.kind === "EXPENSE";
  });

  function applySuggestion(description: string, nextType = type) {
    if (!aiEnabled || nextType === "TRANSFER" || pickedManually) {
      setHint(null);
      return;
    }
    const pool = nextType === "INCOME"
      ? categories.filter((c) => c.kind === "INCOME")
      : categories.filter((c) => c.kind === "EXPENSE");
    const suggested = suggestCategory(description, nextType, pool);
    if (suggested) {
      setCategoryId(suggested.id);
      setHint(`IA sugeriu ${suggested.name}`);
    } else {
      setHint(null);
    }
  }

  if (simple) {
    const cats = filtered;
    if (!accounts[0]) {
      return <p className="text-sm text-muted">Cria um lugar do dinheiro em Onde está. Depois você anota aqui.</p>;
    }
    return (
      <ActionForm action={createTransactionAction} className="space-y-4" submitLabel="Anotar">
        <input type="hidden" name="accountId" value={accounts[0].id} />
        <div>
          <p className="text-sm text-muted mb-2">Isso saiu ou entrou?</p>
          <input type="hidden" name="type" value={type} />
          <div className="kind-pick">
            <button type="button" className={type === "EXPENSE" ? "on-sai" : ""} onClick={() => { setType("EXPENSE"); setCategoryId(""); }}>
              Saiu
            </button>
            <button type="button" className={type === "INCOME" ? "on-entra" : ""} onClick={() => { setType("INCOME"); setCategoryId(""); }}>
              Entrou
            </button>
          </div>
        </div>
        <label className="field">
          <span>Quanto</span>
          <input name="amount" required placeholder="0,00" />
        </label>
        <label className="field">
          <span>O que foi</span>
          <input name="description" required placeholder="Ex.: mercado, luz, salário" />
        </label>
        <label className="field">
          <span>Dia</span>
          <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </label>
        <label className="field">
          <span>Onde encaixa</span>
          <select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Não sei</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </ActionForm>
    );
  }

  return (
    <ActionForm action={createTransactionAction} className="space-y-4" submitLabel="Lançar">
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="field">
          <span>Tipo</span>
          <select
            name="type"
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setCategoryId("");
              setPickedManually(false);
              setHint(null);
            }}
          >
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
        <input
          name="description"
          required
          placeholder="Ex: Supermercado"
          onChange={(e) => applySuggestion(e.target.value)}
        />
      </label>
      {hint ? <p className="text-xs text-gold -mt-2 pop-in">{hint} — pode trocar se quiser.</p> : null}
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
            <select
              name="categoryId"
              value={categoryId}
              onChange={(e) => {
                setCategoryId(e.target.value);
                setPickedManually(true);
                setHint(null);
              }}
            >
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
