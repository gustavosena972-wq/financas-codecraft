"use client";

import { useEffect, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import { addStock, bumpStock, requireSession, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { hasCash } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";

export default function EstoquePage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;
  const ok = hasCash(data.user.plan);

  return (
    <div className="space-y-6">
      <PageHead kicker="Setor" title="Estoque" subtitle="O que tem na prateleira. A IA avisa quando chega no mínimo. Comprar ainda é com você." />
      <Gate allowed={ok} title="Estoque entra no plano Empresa" body="Empresa ou Completo. Sem inventário fantasma: quantidade real, mínimo, custo." />
      {ok ? (
        <>
          <form
            className="card p-6 grid sm:grid-cols-4 gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const cost = parseMoneyToCents(String(form.get("cost") ?? "0")) ?? 0;
              await addStock({
                name: String(form.get("name")),
                qty: Number(form.get("qty") || 0),
                minQty: Number(form.get("min") || 0),
                unitCost: Math.max(0, cost),
              });
              event.currentTarget.reset();
            }}
          >
            <label className="field">
              <span>Item</span>
              <input name="name" required />
            </label>
            <label className="field">
              <span>Qtd</span>
              <input name="qty" type="number" min={0} defaultValue={0} />
            </label>
            <label className="field">
              <span>Mínimo</span>
              <input name="min" type="number" min={0} defaultValue={1} />
            </label>
            <label className="field">
              <span>Custo</span>
              <input name="cost" placeholder="0,00" />
            </label>
            <button className="btn btn-primary sm:col-span-4">Guardar item</button>
          </form>
          {data.stock.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qtd</th>
                    <th>Mínimo</th>
                    <th>Custo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.stock.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>
                      <td>
                        <span className={item.qty <= item.minQty ? "text-negative font-bold" : ""}>{item.qty}</span>
                      </td>
                      <td>{item.minQty}</td>
                      <td>{brl(item.unitCost)}</td>
                      <td className="flex gap-2">
                        <button className="chip" type="button" onClick={() => void bumpStock(item.id, 1)}>
                          +1
                        </button>
                        <button className="chip" type="button" onClick={() => void bumpStock(item.id, -1)}>
                          −1
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty title="Prateleira vazia" body="Cadastra o que você vende ou usa. Quando baixar do mínimo, a IA abre a reposição." />
          )}
        </>
      ) : null}
    </div>
  );
}
