"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listAccounts, listCategories, listRecurring, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl, formatMonthLabel, monthKey } from "@/lib/money";
import { monthAgenda } from "@/lib/queries";
import { ActionForm } from "@/components/action-form";
import { createRecurringAction, deleteRecurringAction, postRecurringAction } from "@/app/actions/extras";
import { go } from "@/lib/types";
import { recurringLimit } from "@/lib/plans";

export default function AgendaPage() {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [limit, setLimit] = useState(3);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; kind: string }[]>([]);
  const [recurring, setRecurring] = useState<ReturnType<typeof listRecurring>>([]);
  const [items, setItems] = useState<ReturnType<typeof monthAgenda>>([]);
  const month = monthKey();

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setAccounts(listAccounts(session.workspace.id));
      setCategories(listCategories(session.workspace.id));
      setRecurring(listRecurring(session.workspace.id));
      setItems(monthAgenda(session.workspace.id, month));
      setLimit(recurringLimit(session.user.plan));
      setReady(true);
    })();
  }, [live, month]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Agenda</h1>
        <p className="text-sm text-muted max-w-2xl">
          Aluguel, internet, DAS. Você cadastra uma vez. No mês, lança — o banco não sai sozinho. {formatMonthLabel(month)}.
        </p>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Quando</th>
              <th>O quê</th>
              <th>Valor</th>
              <th>Situação</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={`${item.source}-${item.id}`}>
                <td className="whitespace-nowrap">{new Date(`${item.date}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                <td>
                  {item.description}
                  {item.source === "recurring" ? <span className="text-xs text-muted"> · recorrente</span> : null}
                </td>
                <td className={item.type === "INCOME" ? "text-positive" : "text-negative"}>
                  {item.type === "INCOME" ? "+" : "−"}
                  {brl(item.amount)}
                </td>
                <td>
                  {item.status === "overdue" ? "Atrasado" : item.status === "today" ? "Hoje" : "A vencer"}
                </td>
                <td>
                  {item.recurringId ? (
                    <button
                      className="text-xs text-muted"
                      onClick={async () => {
                        await postRecurringAction(item.recurringId!);
                      }}
                    >
                      Lançar agora
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
            {!items.length ? (
              <tr>
                <td colSpan={5} className="text-muted">
                  Nada a vencer neste mês. Cadastre um recorrente abaixo ou lance com data futura.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="card p-6 space-y-4">
        <div>
          <h2 className="font-semibold">Contas recorrentes</h2>
          <p className="text-sm text-muted">
            Salário, aluguel, internet. No Free cabem {Number.isFinite(limit) ? limit : "várias"}.{" "}
            {Number.isFinite(limit) ? <Link href="/app/planos">Quer mais? Atualize o plano.</Link> : null}
          </p>
        </div>
        <ul className="text-sm space-y-2">
          {recurring.map((item) => (
            <li key={item.id} className="flex justify-between gap-3 border-b border-line pb-2">
              <span>
                Dia {item.day} · {item.description} · {brl(item.amount)}
              </span>
              <button
                className="text-xs text-muted"
                onClick={async () => {
                  await deleteRecurringAction(item.id);
                }}
              >
                Excluir
              </button>
            </li>
          ))}
        </ul>
        <ActionForm action={createRecurringAction} className="grid sm:grid-cols-2 gap-3" submitLabel="Guardar recorrente">
          <label className="field">
            <span>Descrição</span>
            <input name="description" required placeholder="Aluguel" />
          </label>
          <label className="field">
            <span>Valor</span>
            <input name="amount" required placeholder="0,00" />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select name="type" defaultValue="EXPENSE">
              <option value="EXPENSE">Despesa</option>
              <option value="INCOME">Receita</option>
            </select>
          </label>
          <label className="field">
            <span>Dia do mês</span>
            <input name="day" type="number" min={1} max={28} required defaultValue={5} />
          </label>
          <label className="field">
            <span>Conta</span>
            <select name="accountId" required>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Categoria</span>
            <select name="categoryId">
              <option value="">Sem categoria</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
