"use client";

import { useEffect, useState } from "react";
import { listCostCenters, listParties, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { spendByCostCenter } from "@/lib/ops";
import { planHasOps } from "@/lib/plans";
import { brl } from "@/lib/money";
import {
  createCostCenterAction,
  createPartyAction,
  deleteCostCenterAction,
  deletePartyAction,
} from "@/app/actions/enterprise";
import { ActionForm } from "@/components/action-form";
import { PageHeader, PlanGate } from "@/components/page-header";
import { go } from "@/lib/types";

export default function CentrosPage() {
  const live = useLive();
  const [ops, setOps] = useState(false);
  const [centers, setCenters] = useState<ReturnType<typeof listCostCenters>>([]);
  const [parties, setParties] = useState<ReturnType<typeof listParties>>([]);
  const [spend, setSpend] = useState<{ name: string; amount: number }[]>([]);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOps(planHasOps(session.user.plan));
      setCenters(listCostCenters(session.workspace.id));
      setParties(listParties(session.workspace.id));
      setSpend(spendByCostCenter(session.workspace.id));
    })();
  }, [live]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Empresa"
        title="Centros e parceiros"
        subtitle="Centro de custo para saber onde o dinheiro pesa. Cliente e fornecedor para o título não ficar solto."
      />
      <PlanGate allowed={ops} title="Centros entram no plano Empresa" body="Centro de custo e parceiro são da empresa. Plano Empresa R$ 49 ou Completo R$ 59." />
      {ops ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Centros de custo</h2>
            <ActionForm action={createCostCenterAction} className="flex gap-2 items-end" submitLabel="Incluir">
              <label className="field flex-1">
                <span>Nome</span>
                <input name="name" required placeholder="Operação, Marketing, Sede" />
              </label>
            </ActionForm>
            <ul className="text-sm space-y-2">
              {centers.map((c) => (
                <li key={c.id} className="flex justify-between border-b border-line py-2">
                  <span>{c.name}</span>
                  <button className="text-xs text-muted" onClick={async () => { await deleteCostCenterAction(c.id); }}>
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
            {spend.some((s) => s.amount) ? (
              <div className="text-sm space-y-1 pt-2">
                {spend.filter((s) => s.amount).map((s) => (
                  <div key={s.name} className="flex justify-between">
                    <span>{s.name}</span>
                    <span>{brl(s.amount)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="card p-6 space-y-4">
            <h2 className="font-semibold">Clientes e fornecedores</h2>
            <ActionForm action={createPartyAction} className="grid sm:grid-cols-2 gap-3" submitLabel="Incluir">
              <label className="field sm:col-span-2">
                <span>Nome</span>
                <input name="name" required />
              </label>
              <label className="field">
                <span>Tipo</span>
                <select name="kind">
                  <option value="CUSTOMER">Cliente</option>
                  <option value="SUPPLIER">Fornecedor</option>
                </select>
              </label>
              <label className="field">
                <span>CNPJ ou CPF</span>
                <input name="document" placeholder="opcional" />
              </label>
            </ActionForm>
            <ul className="text-sm space-y-2">
              {parties.map((p) => (
                <li key={p.id} className="flex justify-between border-b border-line py-2">
                  <span>
                    {p.name}
                    <span className="text-muted"> · {p.kind === "CUSTOMER" ? "cliente" : "fornecedor"}</span>
                  </span>
                  <button className="text-xs text-muted" onClick={async () => { await deletePartyAction(p.id); }}>
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
