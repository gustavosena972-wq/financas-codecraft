"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { PageHead } from "@/components/shell";
import { confirmPixSubscription, requireSession, startCardSubscription, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { PLAN, PLAN_PRICE_CENTS, PIX_KEY, PIX_KEY_EMV, isSubscribed } from "@/lib/plans";
import { pixPayload } from "@/lib/pix";
import { brandLabel, formatCardExp, formatCardNumber } from "@/lib/card";
import { brl } from "@/lib/money";

export default function AssinaturaPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [tab, setTab] = useState<"card" | "pix">("card");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);

  const payload = useMemo(
    () =>
      pixPayload({
        key: PIX_KEY_EMV,
        name: "Financas CodeCraft",
        city: "BELO HORIZONTE",
        amountCents: PLAN_PRICE_CENTS,
        txid: "FINANCASCC",
      }),
    [],
  );

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  useEffect(() => {
    void QRCode.toDataURL(payload, { margin: 1, width: 240 }).then(setQr);
  }, [payload]);

  if (!data) return null;
  const active = isSubscribed(data.user);
  const next = data.user.nextChargeAt
    ? new Date(data.user.nextChargeAt).toLocaleDateString("pt-BR")
    : "";

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Cobrança da plataforma"
        title="Assinatura"
        subtitle="Um plano. Cartão cobra sozinho todo mês. PIX é a outra forma de pagar o Finanças CodeCraft."
      />

      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-4">
        <article className="card p-6 space-y-3">
          <span className="chip ok w-fit">Único plano</span>
          <h2 className="font-bold text-2xl">{PLAN.name}</h2>
          <div className="text-4xl font-extrabold">{PLAN.price}</div>
          <p className="text-sm text-muted">{PLAN.period}</p>
          <p className="text-sm">{PLAN.forWho}</p>
          <ul className="text-sm space-y-1.5 pt-2">
            {PLAN.includes.map((line) => (
              <li key={line}>· {line}</li>
            ))}
          </ul>
          {active ? (
            <div className="rounded-2xl border border-line p-4 space-y-1">
              <p className="chip ok w-fit">Assinatura ativa</p>
              <p className="text-sm">
                {data.user.billingMethod === "card"
                  ? `${brandLabel(data.user.cardBrand)} •••• ${data.user.cardLast4} · próxima cobrança ${next}`
                  : `Pago no PIX da plataforma · próximo vencimento ${next}`}
              </p>
            </div>
          ) : data.user.billingStatus === "past_due" ? (
            <p className="chip warn w-fit">PIX do mês vencido. Pague de novo para reabrir.</p>
          ) : null}
        </article>

        <article className="card p-6 space-y-4">
          <div className="flex gap-2">
            <button className={`btn ${tab === "card" ? "btn-primary" : "btn-ghost"}`} type="button" onClick={() => setTab("card")}>
              Cartão
            </button>
            <button className={`btn ${tab === "pix" ? "btn-primary" : "btn-ghost"}`} type="button" onClick={() => setTab("pix")}>
              PIX
            </button>
          </div>

          {tab === "card" ? (
            <form
              className="grid gap-3"
              onSubmit={async (event) => {
                event.preventDefault();
                setError("");
                setBusy(true);
                try {
                  await startCardSubscription({ number, name, exp, cvv });
                  setCvv("");
                  go("/app");
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Não deu para cobrar o cartão.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <p className="text-sm text-muted">
                {brl(PLAN_PRICE_CENTS)} entra agora e de novo no mesmo dia, todo mês, neste cartão.
              </p>
              <label className="field">
                <span>Nome no cartão</span>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="cc-name" required />
              </label>
              <label className="field">
                <span>Número</span>
                <input
                  value={number}
                  onChange={(event) => setNumber(formatCardNumber(event.target.value))}
                  inputMode="numeric"
                  autoComplete="cc-number"
                  placeholder="ACCT-000003"
                  required
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="field">
                  <span>Validade</span>
                  <input
                    value={exp}
                    onChange={(event) => setExp(formatCardExp(event.target.value))}
                    inputMode="numeric"
                    autoComplete="cc-exp"
                    placeholder="MM/AA"
                    required
                  />
                </label>
                <label className="field">
                  <span>CVV</span>
                  <input
                    value={cvv}
                    onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                    inputMode="numeric"
                    autoComplete="cc-csc"
                    required
                  />
                </label>
              </div>
              {error ? <p className="text-sm text-negative">{error}</p> : null}
              <button className="btn btn-primary" disabled={busy}>
                {busy ? "Cobrando…" : `Assinar ${PLAN.price}/mês no cartão`}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted">
                Pague {brl(PLAN_PRICE_CENTS)} no PIX da plataforma. Chave {PIX_KEY}. Depois confirme aqui para abrir o sistema.
              </p>
              {qr ? <img src={qr} alt="QR Code PIX da assinatura" className="w-48 h-48 rounded-2xl bg-white p-2" /> : null}
              <p className="text-sm font-bold">Chave PIX {PIX_KEY}</p>
              <button
                className="btn btn-ink"
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(payload);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
              >
                {copied ? "PIX copiado" : "Copiar PIX da plataforma"}
              </button>
              {error ? <p className="text-sm text-negative">{error}</p> : null}
              <button
                className="btn btn-primary"
                type="button"
                disabled={busy}
                onClick={async () => {
                  setError("");
                  setBusy(true);
                  try {
                    await confirmPixSubscription();
                    go("/app");
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Não deu para confirmar o PIX.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {busy ? "Confirmando…" : "Já paguei o PIX da plataforma"}
              </button>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
