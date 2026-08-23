"use client";

import { useState } from "react";
import { deleteHouseSheetAction } from "@/app/actions/import";
import { go } from "@/lib/types";

export function DeleteHouseSheet({ compact = false }: { compact?: boolean }) {
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function wipe() {
    setBusy(true);
    const response = await deleteHouseSheetAction();
    setBusy(false);
    if (response.error) {
      setMessage(response.error);
      return;
    }
    go("/app");
  }

  return (
    <article className="card p-6 space-y-3">
      <h2 className="font-semibold">{compact ? "Apagar a planilha antiga" : "Quando o ano acabar"}</h2>
      <p className="text-sm text-muted max-w-2xl">
        Apaga a planilha velha e o app inteiro da casa zera na hora: mês, ano, cartão e onde está o dinheiro. Empresa não
        mexe. Depois você manda a planilha do ano novo.
      </p>
      {!ask ? (
        <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setAsk(true)}>
          Apagar a planilha antiga
        </button>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void wipe()}>
            {busy ? "Apagando…" : "Sim, zerar a casa agora"}
          </button>
          <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => setAsk(false)}>
            Não
          </button>
        </div>
      )}
      {message ? <p className="text-sm text-negative">{message}</p> : null}
    </article>
  );
}
