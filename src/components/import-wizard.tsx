"use client";

import { useState } from "react";
import { confirmImportAction, previewImportAction } from "@/app/actions/import";
import { brl } from "@/lib/money";
import type { MappedRow } from "@/lib/excel";

export function ImportWizard() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<MappedRow[] | null>(null);
  const [duplicates, setDuplicates] = useState(0);
  const [done, setDone] = useState<string | null>(null);

  async function onPreview(formData: FormData) {
    setBusy(true);
    setError(null);
    setDone(null);
    const result = await previewImportAction(formData);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      setRows(null);
      return;
    }
    setRows(result.rows ?? []);
    setDuplicates(result.duplicates ?? 0);
  }

  async function onConfirm() {
    if (!rows) return;
    setBusy(true);
    const result = await confirmImportAction(JSON.stringify(rows));
    setBusy(false);
    if ("error" in result && result.error) {
      setError(result.error);
      return;
    }
    setDone(result.ok ?? "Importação concluída.");
    setRows(null);
  }

  const valid = rows?.filter((r) => r.issues.length === 0).length ?? 0;

  return (
    <div className="space-y-5">
      <form action={onPreview} className="card p-6 space-y-4">
        <label className="field">
          <span>Arquivo Excel ou CSV</span>
          <input name="file" type="file" accept=".xlsx,.xls,.csv,.txt" required />
        </label>
        <p className="text-sm text-muted">
          Colunas reconhecidas: Data, Descrição, Valor, Tipo, Categoria, Conta, Observações.
          A validação acontece antes de gravar. Duplicatas conhecidas são marcadas.
        </p>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Lendo…" : "Validar arquivo"}
        </button>
      </form>

      {error ? <p className="text-sm text-negative">{error}</p> : null}
      {done ? <p className="text-sm text-positive">{done}</p> : null}

      {rows ? (
        <div className="card p-6 space-y-4">
          <div className="flex justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted">
              {valid} linha(s) prontas. {duplicates} possível(is) duplicata(s). Linhas com erro não entram.
            </p>
            <button className="btn btn-ink" onClick={onConfirm} disabled={busy || valid === 0}>
              Importar válidas
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 80).map((row, i) => (
                  <tr key={`${row.hash}-${i}`}>
                    <td>{row.date || "—"}</td>
                    <td>{row.description || "—"}</td>
                    <td>{row.amount ? brl(row.amount) : "—"}</td>
                    <td>{row.type === "INCOME" ? "Receita" : "Despesa"}</td>
                    <td className={row.issues.length ? "text-negative" : "text-positive"}>
                      {row.issues.length ? row.issues.join(", ") : "Ok"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
