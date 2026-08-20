import { requireWorkspace } from "@/lib/auth";
import { brl, formatMonthLabel, monthKey } from "@/lib/money";
import { cashflowSeries, projectedCashflow } from "@/lib/queries";
import { CashflowChart } from "@/components/charts";

export default async function CashflowPage() {
  const { workspace } = await requireWorkspace();
  const month = monthKey();
  const [series, projection] = await Promise.all([
    cashflowSeries(workspace.id, 6),
    projectedCashflow(workspace.id, month),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Fluxo de caixa</h1>
        <p className="text-sm text-muted">
          Realizado neste mês e uma projeção simples com o ritmo atual — sem decidir por você.
        </p>
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
          <div className="text-xs text-muted mt-1">Se o ritmo de {formatMonthLabel(month)} continuar</div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4">Últimos 6 meses</h2>
        <CashflowChart data={series} />
      </div>
    </div>
  );
}
