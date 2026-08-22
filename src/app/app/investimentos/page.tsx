"use client";

import { useEffect, useState } from "react";
import { listHoldings, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl } from "@/lib/money";
import { go } from "@/lib/types";
import { ActionForm } from "@/components/action-form";
import { createHoldingAction, deleteHoldingAction } from "@/app/actions/extras";
import { netWorthSnapshot } from "@/lib/net-worth";

const KIND = {
  STOCK: "Ação / ETF",
  FUND: "Fundo",
  FIXED: "Renda fixa",
  CRYPTO: "Cripto",
  OTHER: "Outro",
};

export default function InvestimentosPage() {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<ReturnType<typeof listHoldings>>([]);
  const [invested, setInvested] = useState(0);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setRows(listHoldings(session.workspace.id));
      setInvested(netWorthSnapshot(session.workspace.id).invested);
      setReady(true);
    })();
  }, [live]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Carteira</p>
        <h1 className="text-2xl font-semibold mt-1">Investimentos</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Monitora o valor da carteira em cada corretora — por enquanto você lança o saldo. Open Finance (Pluggy/Belvo) entra depois; não vamos no Banco Central direto.
        </p>
      </div>
      <article className="card p-5">
        <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">Total investido</div>
        <div className="text-3xl font-semibold mt-1">{brl(invested)}</div>
      </article>
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Novo ativo</h2>
        <ActionForm action={createHoldingAction} className="grid sm:grid-cols-3 gap-3" submitLabel="Guardar">
          <label className="field">
            <span>Nome</span>
            <input name="name" required placeholder="Tesouro Selic, IVVB11…" />
          </label>
          <label className="field">
            <span>Tipo</span>
            <select name="kind" defaultValue="FIXED">
              {Object.entries(KIND).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Valor de hoje</span>
            <input name="value" required placeholder="0,00" />
          </label>
        </ActionForm>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{KIND[row.kind]}</td>
                  <td>{brl(row.value)}</td>
                  <td>
                    <button className="text-xs text-muted" onClick={() => void deleteHoldingAction(row.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="text-sm text-muted">
                  Nenhum ativo ainda. O patrimônio no início soma isso com as contas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
