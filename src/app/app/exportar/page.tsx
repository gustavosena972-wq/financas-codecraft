import { requireWorkspace } from "@/lib/auth";
import { monthKey, formatMonthLabel, shiftMonth } from "@/lib/money";
import Link from "next/link";

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { workspace } = await requireWorkspace();
  const month = (await searchParams).month ?? monthKey();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exportar para Excel</h1>
        <p className="text-sm text-muted">
          Relatório do período em {workspace.name}. Use o modelo também para reimportar depois.
        </p>
      </div>
      <div className="card p-6 max-w-lg space-y-4">
        <p className="capitalize font-semibold">{formatMonthLabel(month)}</p>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/app/exportar?month=${shiftMonth(month, -1)}`}>
            Mês anterior
          </Link>
          <Link className="btn btn-ghost" href={`/app/exportar?month=${shiftMonth(month, 1)}`}>
            Próximo
          </Link>
        </div>
        <a className="btn btn-primary" href={`/app/exportar/arquivo?month=${month}`}>
          Baixar Excel
        </a>
      </div>
    </div>
  );
}
