"use client";

import { useEffect, useState } from "react";
import { requestBankLinksAction } from "@/app/actions/accounts";
import { whatsappLink } from "@/lib/pix";

export const HOUSE_BANKS = ["Nubank", "Inter", "Will", "Magazine Luiza", "C&A", "Mercado Pago"];

export function BankConnect({ selected }: { selected: string[] }) {
  const [picked, setPicked] = useState<string[]>(selected);
  const [other, setOther] = useState("");

  useEffect(() => {
    setPicked(selected);
  }, [selected]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function toggle(name: string) {
    setPicked((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  async function save() {
    const names = [...picked, other.trim()].filter(Boolean);
    setBusy(true);
    const response = await requestBankLinksAction(names);
    setBusy(false);
    setMessage(response.error ?? response.ok ?? null);
  }

  const pedido = `Olá! Quero ligar o Open Finance no Finanças CodeCraft. Bancos: ${[...picked, other.trim()].filter(Boolean).join(", ") || "a combinar"}. Sem senha no app.`;

  return (
    <article className="card p-6 space-y-3">
      <h2 className="font-semibold">Ligar os bancos</h2>
      <p className="text-sm text-muted">
        É assim que o app fica inteligente de verdade: o banco avisa sozinho quando sai dinheiro. A gente não pede senha
        do Nubank nem do Inter. Você autoriza no app do banco, pelo Open Finance.
      </p>
      <div className="flex flex-wrap gap-2">
        {HOUSE_BANKS.map((name) => {
          const on = picked.includes(name);
          return (
            <button
              key={name}
              type="button"
              className={`btn ${on ? "btn-primary" : "btn-ghost"}`}
              onClick={() => toggle(name)}
            >
              {name}
            </button>
          );
        })}
      </div>
      <label className="field">
        <span>Outro banco ou cartão</span>
        <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Se tiver mais um..." />
      </label>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void save()}>
          {busy ? "Guardando…" : "Quero ligar esses"}
        </button>
        <a className="btn btn-ghost" href={whatsappLink(pedido)}>
          Combinar a ligação
        </a>
      </div>
      {selected.length ? (
        <p className="text-sm text-muted">Pedido na casa: {selected.join(", ")}. O gasto entra sozinho quando o banco autorizar.</p>
      ) : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </article>
  );
}
