"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { formatMonthLabel, monthKey, shiftMonth } from "@/lib/money";
import { monthSummary } from "@/lib/queries";
import { buildExportBuffer } from "@/lib/excel";
import { go } from "@/lib/types";

export default function ExportPage() {
  const live = useLive();
  const [month, setMonth] = useState(monthKey());
  const [name, setName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setMonth(params.get("month") ?? monthKey());
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setName(session.workspace.name);
    })();
  }, [live]);

  async function download() {
    const session = await requireSession();
    if (!session) return;
    const { txs } = monthSummary(session.workspace.id, month);
    const buffer = await buildExportBuffer(
      txs.map((tx) => ({
        date: new Date(tx.date),
        description: tx.description,
        amount: tx.amount,
        type: tx.type,
        category: tx.category?.name,
        account: tx.account.name,
        notes: tx.notes,
      })),
    );
    const blob = new Blob([buffer as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `financas-codecraft-${month}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Exportar para Excel</h1>
        <p className="text-sm text-muted">Relatório do período em {name}.</p>
      </div>
      <div className="card p-6 max-w-lg space-y-4">
        <p className="capitalize font-semibold">{formatMonthLabel(month)}</p>
        <div className="flex gap-2">
          <Link className="btn btn-ghost" href={`/app/exportar?month=${shiftMonth(month, -1)}`}>Mês anterior</Link>
          <Link className="btn btn-ghost" href={`/app/exportar?month=${shiftMonth(month, 1)}`}>Próximo</Link>
        </div>
        <button className="btn btn-primary" onClick={download}>Baixar Excel</button>
      </div>
    </div>
  );
}
