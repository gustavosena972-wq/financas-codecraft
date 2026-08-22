"use client";

import { useState } from "react";
import { applyOrganizeAction } from "@/app/actions/import";
import { brl } from "@/lib/money";
import { organizeWorkbook, type OrganizeResult } from "@/lib/organize";

export function OrganizeWizard() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<OrganizeResult | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onFile(formData: FormData) {
    setBusy(true);
    setMessage(null);
    const file = formData.get("file");
    if (!(file instanceof File) || !file.size) {
      setBusy(false);
      setMessage("Escolha o arquivo no computador.");
      return;
    }
    const organized = await organizeWorkbook(await file.arrayBuffer(), file.name);
    setBusy(false);
    if (organized.error) {
      setResult(null);
      setMessage(organized.error);
      return;
    }
    setResult(organized);
  }

  async function sendToApp() {
    if (!result) return;
    setBusy(true);
    const response = await applyOrganizeAction(JSON.stringify(result));
    setBusy(false);
    setMessage(response.ok ?? response.error ?? "Pronto.");
  }

  return (
    <div className="space-y-5">
      <form action={onFile} className="card p-6 space-y-4">
        <label className="field">
          <span>Arquivo do computador</span>
          <input name="file" type="file" accept=".xlsx,.xls,.csv,.txt" required />
        </label>
        <p className="text-sm text-muted">
          O arquivo da casa: abas Jan a Dez, ou Resumo anual. O app separa cartão, fixas e o resto.
        </p>
        <button className="btn btn-primary" disabled={busy}>
          {busy ? "Lendo…" : "Mandar planilha"}
        </button>
      </form>

      {message ? <p className="text-sm text-muted">{message}</p> : null}

      {result ? (
        <div className="space-y-4">
          <div className="card p-6 space-y-3">
            <h2 className="font-semibold">O que a planilha está dizendo</h2>
            <ul className="text-sm space-y-2">
              {result.notes.map((note) => (
                <li key={note}>• {note}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 pt-2">
              <button className="btn btn-primary" disabled={busy} onClick={() => void sendToApp()}>
                Mandar para os gastos
              </button>
            </div>
          </div>
          {result.months.length ? (
            <div className="card overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th>Receitas</th>
                    <th>Despesas</th>
                    <th>Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {result.months.map((month) => (
                    <tr key={month.month}>
                      <td>{month.month}</td>
                      <td className="text-positive">{brl(month.income)}</td>
                      <td className="text-negative">{brl(month.expense)}</td>
                      <td className={month.net >= 0 ? "text-positive" : "text-negative"}>{brl(month.net)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
