"use client";

import { useEffect, useState } from "react";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl, formatMonthLabel, monthKey, shiftMonth } from "@/lib/money";
import { buildDre } from "@/lib/ops";
import { planHasClose, planHasOps } from "@/lib/plans";
import { listLockedMonths } from "@/lib/store";
import { toggleMonthLockAction } from "@/app/actions/enterprise";
import { go } from "@/lib/types";
import { PageHeader, PlanGate } from "@/components/page-header";

export default function DrePage() {
  const live = useLive();
  const [month, setMonth] = useState(monthKey());
  const [ops, setOps] = useState(false);
  const [canClose, setCanClose] = useState(false);
  const [locked, setLocked] = useState(false);
  const [dre, setDre] = useState<ReturnType<typeof buildDre> | null>(null);
  const [ws, setWs] = useState("");

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOps(planHasOps(session.user.plan));
      setCanClose(planHasClose(session.user.plan));
      setLocked(listLockedMonths(session.workspace.id).includes(month));
      setDre(buildDre(session.workspace.id, month));
      setWs(session.workspace.name);
    })();
  }, [live, month]);

  if (!dre) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Análise"
        title="DRE"
        subtitle={`Demonstrativo de resultado de ${ws}. Receitas, despesas e margem do período.`}
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => setMonth(shiftMonth(month, -1))}>Mês anterior</button>
            <button className="btn btn-ghost" onClick={() => setMonth(shiftMonth(month, 1))}>Próximo</button>
            <button className="btn btn-ink" onClick={() => window.print()}>Imprimir</button>
            {canClose ? (
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  await toggleMonthLockAction(month);
                }}
              >
                {locked ? "Reabrir mês" : "Fechar mês"}
              </button>
            ) : null}
          </>
        }
      />
      <PlanGate
        allowed={ops}
        title="DRE entra no plano Empresa"
        body="Só no espaço Empresa, no Empresa 100 (R$ 100) ou 200 (R$ 200)."
      />
      {ops ? (
        <div className="card overflow-hidden print-sheet">
          <div className="px-6 py-5 border-b border-line flex justify-between">
            <div>
              <div className="text-xs uppercase tracking-widest text-muted">Finanças CodeCraft</div>
              <h2 className="text-lg font-semibold capitalize mt-1">{formatMonthLabel(month)}</h2>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted">Resultado</div>
              <div className={`text-2xl font-semibold ${dre.net >= 0 ? "text-positive" : "text-negative"}`}>{brl(dre.net)}</div>
              <div className="text-xs text-muted">Margem {dre.margin}%</div>
            </div>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Conta</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-semibold" colSpan={2}>Receitas</td>
              </tr>
              {dre.incomeRows.map((row) => (
                <tr key={row.name}>
                  <td className="pl-6">{row.name}</td>
                  <td className="text-right text-positive">{brl(row.amount)}</td>
                </tr>
              ))}
              <tr>
                <td className="font-semibold">Total receitas</td>
                <td className="text-right font-semibold">{brl(dre.income)}</td>
              </tr>
              <tr>
                <td className="font-semibold" colSpan={2}>Despesas</td>
              </tr>
              {dre.expenseRows.map((row) => (
                <tr key={row.name}>
                  <td className="pl-6">{row.name}</td>
                  <td className="text-right text-negative">{brl(row.amount)}</td>
                </tr>
              ))}
              <tr>
                <td className="font-semibold">Total despesas</td>
                <td className="text-right font-semibold">{brl(dre.expense)}</td>
              </tr>
              <tr>
                <td className="font-semibold">Resultado do período</td>
                <td className={`text-right font-semibold ${dre.net >= 0 ? "text-positive" : "text-negative"}`}>{brl(dre.net)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
