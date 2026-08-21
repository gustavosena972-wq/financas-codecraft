"use client";

import { useEffect, useMemo, useState } from "react";
import { listAccounts, listBills, listCostCenters, listParties, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl } from "@/lib/money";
import { planHasOps } from "@/lib/plans";
import { createBillAction, deleteBillAction, settleBillAction } from "@/app/actions/enterprise";
import { ActionForm } from "@/components/action-form";
import { PageHeader, PlanGate } from "@/components/page-header";
import { go } from "@/lib/types";

export default function TitulosPage() {
  const live = useLive();
  const [ops, setOps] = useState(false);
  const [bills, setBills] = useState<ReturnType<typeof listBills>>([]);
  const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
  const [parties, setParties] = useState<ReturnType<typeof listParties>>([]);
  const [centers, setCenters] = useState<ReturnType<typeof listCostCenters>>([]);
  const [kind, setKind] = useState<"ALL" | "PAYABLE" | "RECEIVABLE">("ALL");
  const [accountId, setAccountId] = useState("");

  function load(workspaceId: string) {
    setBills(listBills(workspaceId));
    setAccounts(listAccounts(workspaceId));
    setParties(listParties(workspaceId));
    setCenters(listCostCenters(workspaceId));
  }

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOps(planHasOps(session.user.plan));
      load(session.workspace.id);
      const first = listAccounts(session.workspace.id)[0];
      if (first) setAccountId((current) => current || first.id);
    })();
  }, [live]);

  const overview = useMemo(() => billsOverviewFrom(bills), [bills]);
  const rows = bills.filter((b) => (kind === "ALL" ? true : b.kind === kind));

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Operação"
        title="Títulos"
        subtitle="Contas a pagar e a receber. Baixa gera lançamento no caixa. Isso é o que a tesouraria usa todo dia."
      />
      <PlanGate allowed={ops} title="Títulos entram no plano Empresa" body="Contas a pagar e a receber ficam só na empresa. Plano Empresa R$ 49 ou Completo R$ 59." />
      {ops ? (
        <>
          <section className="grid sm:grid-cols-4 gap-3">
            <Kpi label="A pagar" value={brl(overview.payables)} />
            <Kpi label="A receber" value={brl(overview.receivables)} />
            <Kpi label="Pagar em atraso" value={brl(overview.overduePay)} tone="neg" />
            <Kpi label="Receber em atraso" value={brl(overview.overdueRec)} tone="neg" />
          </section>
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Novo título</h2>
            <ActionForm
              action={createBillAction}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
              submitLabel="Lançar título"
            >
              <label className="field">
                <span>Tipo</span>
                <select name="kind">
                  <option value="PAYABLE">A pagar</option>
                  <option value="RECEIVABLE">A receber</option>
                </select>
              </label>
              <label className="field">
                <span>Parceiro</span>
                <input name="partyName" required list="party-list" placeholder="Fornecedor ou cliente" />
                <datalist id="party-list">
                  {parties.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                <span>Descrição</span>
                <input name="description" required placeholder="NF, aluguel, serviço" />
              </label>
              <label className="field">
                <span>Valor</span>
                <input name="amount" required placeholder="0,00" />
              </label>
              <label className="field">
                <span>Vencimento</span>
                <input name="due" type="date" required />
              </label>
              <label className="field">
                <span>Centro de custo</span>
                <select name="costCenterId">
                  <option value="">Nenhum</option>
                  {centers.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
            </ActionForm>
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <label className="field">
              <span>Filtro</span>
              <select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
                <option value="ALL">Todos</option>
                <option value="PAYABLE">A pagar</option>
                <option value="RECEIVABLE">A receber</option>
              </select>
            </label>
            <label className="field">
              <span>Conta na baixa</span>
              <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Vencimento</th>
                  <th>Parceiro</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((bill) => (
                  <tr key={bill.id}>
                    <td className="whitespace-nowrap">{new Date(`${bill.due}T12:00:00`).toLocaleDateString("pt-BR")}</td>
                    <td>{bill.partyName}</td>
                    <td>{bill.description}</td>
                    <td>{bill.kind === "PAYABLE" ? "Pagar" : "Receber"}</td>
                    <td>{brl(bill.amount)}</td>
                    <td>{bill.status === "PAID" ? "Baixado" : "Aberto"}</td>
                    <td>
                      <div className="flex gap-2 justify-end">
                        {bill.status === "OPEN" ? (
                          <button
                            className="text-xs font-semibold"
                            onClick={async () => {
                              await settleBillAction(bill.id, accountId);
                            }}
                          >
                            Baixar
                          </button>
                        ) : null}
                        <button
                          className="text-xs text-muted"
                          onClick={async () => {
                            await deleteBillAction(bill.id);
                          }}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!rows.length ? (
                  <tr>
                    <td colSpan={7} className="text-muted">Nenhum título. Cadastre o que vence: aluguel, NF, cliente.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}

function billsOverviewFrom(bills: ReturnType<typeof listBills>) {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const open = bills.filter((b) => b.status === "OPEN");
  const payables = open.filter((b) => b.kind === "PAYABLE");
  const receivables = open.filter((b) => b.kind === "RECEIVABLE");
  return {
    payables: payables.reduce((s, b) => s + b.amount, 0),
    receivables: receivables.reduce((s, b) => s + b.amount, 0),
    overduePay: payables.filter((b) => b.due < iso).reduce((s, b) => s + b.amount, 0),
    overdueRec: receivables.filter((b) => b.due < iso).reduce((s, b) => s + b.amount, 0),
  };
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "neg" }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wide text-muted font-semibold">{label}</div>
      <div className={`text-xl font-semibold mt-1 ${tone === "neg" ? "text-negative" : ""}`}>{value}</div>
    </div>
  );
}
