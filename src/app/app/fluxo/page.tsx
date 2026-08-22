"use client";

import { useEffect, useState } from "react";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl, monthKey } from "@/lib/money";
import { cashflowSeries, projectedCashflow } from "@/lib/queries";
import { CashflowChart } from "@/components/charts";
import { go } from "@/lib/types";

export default function CashflowPage() {
  const live = useLive();
  const [month] = useState(monthKey());
  const [series, setSeries] = useState<ReturnType<typeof cashflowSeries>>([]);
  const [projection, setProjection] = useState<ReturnType<typeof projectedCashflow> | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setSeries(cashflowSeries(session.workspace.id, 6));
      setProjection(projectedCashflow(session.workspace.id, month));
    })();
  }, [live, month]);

  if (!projection) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo de caixa</h1>
        <p className="text-sm text-muted max-w-2xl">Saldo de agora e o que ainda entra ou sai. Olhe antes de um pagamento grande. Título a receber não é caixa até cair.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="text-xs text-muted uppercase font-semibold">Saldo atual</div>
          <div className="text-2xl font-semibold mt-2">{brl(projection.currentBalance)}</div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted uppercase font-semibold">Resultado do mês</div>
          <div className={`text-2xl font-semibold mt-2 ${projection.income - projection.expense >= 0 ? "text-positive" : "text-negative"}`}>
            {brl(projection.income - projection.expense)}
          </div>
        </div>
        <div className="card p-5">
          <div className="text-xs text-muted uppercase font-semibold">Saldo projetado</div>
          <div className="text-2xl font-semibold mt-2">{brl(projection.projectedBalance)}</div>
          <div className="text-xs text-muted mt-1">
            {projection.remainingRecurring ? "Inclui recorrentes ainda não lançados" : "Sem recorrentes pendentes neste mês"}
          </div>
        </div>
      </div>
      <div className="card p-5">
        <h2 className="font-semibold mb-4">Últimos 6 meses</h2>
        <CashflowChart data={series} />
      </div>
    </div>
  );
}
