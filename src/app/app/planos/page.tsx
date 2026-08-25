"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { PageHead } from "@/components/shell";
import { cancelSubscription, registerCardAndSubscribe, requireSession, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, type PlanId } from "@/lib/types";
import { PLANS, PIX_KEY, PIX_KEY_EMV, hasCardOnFile, isSubscribed, planById, planPriceCents } from "@/lib/plans";
import { pixPayload } from "@/lib/pix";
import { brandLabel, formatCardExp, formatCardNumber } from "@/lib/card";
import { formatCpf } from "@/lib/company";
import { brl } from "@/lib/money";

type PaidPlan = Exclude<PlanId, "NONE">;

const USE_ASAAS = (process.env.NEXT_PUBLIC_BILLING_PROVIDER || "local").toLowerCase() === "asaas";

export default function AssinaturaPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [plan, setPlan] = useState<PaidPlan>("BUSINESS");
  const [firstPay, setFirstPay] = useState<"card" | "pix">("card");
  const [number, setNumber] = useState("");
  const [name, setName] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [asaasPix, setAsaasPix] = useState<{ payload: string; image?: string | null } | null>(null);
  const [awaitingPix, setAwaitingPix] = useState(false);

  const selected = planById(plan);
  const priceCents = planPriceCents(plan);

  const localPayload = useMemo(
    () =>
      pixPayload({
        key: PIX_KEY_EMV,
        name: "CodeCraft Gestao",
        city: "BELO HORIZONTE",
        amountCents: priceCents,
        txid: `CC${plan}`,
      }),
    [plan, priceCents],
  );

  const displayPayload = asaasPix?.payload || (!USE_ASAAS ? localPayload : "");
  const displayQr = asaasPix?.image || qr;

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else {
        setData(session);
        if (session.user.plan !== "NONE") setPlan(session.user.plan);
        if (session.user.billingStatus === "active" && isSubscribed(session.user)) {
          setAwaitingPix(false);
          setAsaasPix(null);
        }
      }
    });
  }, [live]);

  useEffect(() => {
    if (asaasPix?.image) {
      setQr("");
      return;
    }
    if (!displayPayload) {
      setQr("");
      return;
    }
    void QRCode.toDataURL(displayPayload, { margin: 1, width: 220 }).then(setQr);
  }, [displayPayload, asaasPix?.image]);

  useEffect(() => {
    if (!awaitingPix) return;
    const id = window.setInterval(() => {
      void requireSession().then((session) => {
        if (session && isSubscribed(session.user)) {
          setAwaitingPix(false);
          go("/app");
        }
      });
    }, 4000);
    return () => window.clearInterval(id);
  }, [awaitingPix]);

  if (!data) return null;
  const active = isSubscribed(data.user);
  const cardSaved = hasCardOnFile(data.user);
  const next = data.user.nextChargeAt
    ? new Date(data.user.nextChargeAt).toLocaleDateString("pt-BR")
    : "";

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Billing SaaS"
        title="Assinatura"
        subtitle="R$ 280 a R$ 500 por mês via Asaas. 1º mês no PIX ou cartão; renovação automática no cartão. Cancele quando quiser."
      />

      <div className="grid md:grid-cols-3 gap-4">
        {PLANS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`card p-5 text-left ${plan === item.id ? "ring-2 ring-[color:var(--gold)]" : ""} ${item.highlight ? "" : ""}`}
            onClick={() => setPlan(item.id)}
            disabled={active}
          >
            {item.badge ? <span className="chip warn w-fit">{item.badge}</span> : null}
            <h2 className="font-bold text-lg mt-2">{item.name}</h2>
            <div className="text-3xl font-extrabold mt-1">{item.price}</div>
            <p className="text-xs text-muted">{item.period}</p>
            <p className="text-sm text-muted mt-2">{item.forWho}</p>
            <ul className="text-sm mt-3 space-y-1">
              {item.includes.slice(0, 4).map((line) => (
                <li key={line}>· {line}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-4">
        <article className="card p-6 space-y-3">
          <p className="kicker">Plano escolhido</p>
          <h2 className="font-bold text-2xl">{selected.name}</h2>
          <div className="text-4xl font-extrabold">{selected.price}</div>
          <p className="text-sm text-muted">{selected.period}</p>
          {active ? (
            <div className="rounded-2xl border border-line p-4 space-y-1">
              <p className="chip ok w-fit">Assinatura ativa · renovação ligada</p>
              <p className="text-sm font-bold">
                {brandLabel(data.user.cardBrand)} •••• {data.user.cardLast4}
              </p>
              <p className="text-sm text-muted">{data.user.cardHolder}</p>
              <p className="text-sm text-muted">Validade {data.user.cardExp} · próxima cobrança {next}</p>
              <button
                className="btn btn-ghost mt-2"
                type="button"
                onClick={async () => {
                  if (!window.confirm("Cancelar a assinatura agora?")) return;
                  await cancelSubscription();
                }}
              >
                Cancelar assinatura
              </button>
            </div>
          ) : data.user.billingStatus === "past_due" ? (
            <p className="chip warn w-fit">Renovação falhou. Cadastre um cartão válido de novo.</p>
          ) : cardSaved ? (
            <p className="chip warn w-fit">Cartão salvo, mas a assinatura ainda não está ativa.</p>
          ) : null}
        </article>

        {!active ? (
          <article className="card p-6 space-y-4">
            <div>
              <p className="kicker">Cartão obrigatório</p>
              <h3 className="font-bold text-lg mt-1">Cadastrar e assinar</h3>
              <p className="text-sm text-muted mt-1">
                O cartão fica na assinatura mensal do Asaas. Sem cartão a renovação não roda; o 1º mês pode ser PIX ou cartão.
              </p>
            </div>

            {awaitingPix && asaasPix ? (
              <div className="rounded-2xl border border-line p-4 space-y-3">
                <p className="chip warn w-fit">Aguardando pagamento PIX</p>
                <p className="text-sm">
                  Pague {brl(priceCents)} no PIX. A assinatura ativa sozinha quando o Asaas confirmar.
                </p>
                {displayQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={displayQr} alt="QR Code PIX da assinatura" className="w-44 h-44 rounded-2xl bg-white p-2" />
                ) : null}
                <button
                  className="btn btn-ink"
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(asaasPix.payload);
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? "PIX copiado" : "Copiar PIX"}
                </button>
                <p className="text-xs text-muted">Esta página atualiza a cada poucos segundos.</p>
              </div>
            ) : (
              <form
                className="grid gap-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setError("");
                  setBusy(true);
                  try {
                    const result = await registerCardAndSubscribe({
                      number,
                      name,
                      exp,
                      cvv,
                      cpf,
                      plan,
                      firstPay,
                    });
                    setCvv("");
                    if (USE_ASAAS && firstPay === "pix" && result.pixPayload && !result.activated) {
                      setAsaasPix({ payload: result.pixPayload, image: result.pixImage });
                      setAwaitingPix(true);
                      return;
                    }
                    if (result.activated || !USE_ASAAS) go("/app");
                    else if (USE_ASAAS && firstPay === "card") {
                      setError("Pagamento em análise. Se não ativar em instantes, atualize a página.");
                    }
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Não deu para cadastrar o cartão.");
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <label className="field">
                  <span>Nome no cartão</span>
                  <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="cc-name" required />
                </label>
                <label className="field">
                  <span>Número do cartão</span>
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
                <label className="field">
                  <span>CPF do dono do cartão</span>
                  <input
                    value={cpf}
                    onChange={(event) => setCpf(formatCpf(event.target.value))}
                    inputMode="numeric"
                    placeholder="000.000.000-00"
                    required
                  />
                </label>

                <div className="rounded-2xl border border-line p-4 space-y-3">
                  <p className="kicker">Primeiro mês · {brl(priceCents)}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className={`btn ${firstPay === "card" ? "btn-primary" : "btn-ghost"}`}
                      type="button"
                      onClick={() => setFirstPay("card")}
                    >
                      Cobrar no cartão
                    </button>
                    <button
                      className={`btn ${firstPay === "pix" ? "btn-primary" : "btn-ghost"}`}
                      type="button"
                      onClick={() => setFirstPay("pix")}
                    >
                      {USE_ASAAS ? "Pagar com PIX" : "Paguei no PIX"}
                    </button>
                  </div>
                  {firstPay === "pix" && !USE_ASAAS ? (
                    <div className="space-y-3 pt-1">
                      <p className="text-sm">
                        Pague {brl(priceCents)} no PIX ({PIX_KEY}), depois confirme com o cartão preenchido.
                      </p>
                      {qr ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qr} alt="QR Code PIX da assinatura" className="w-44 h-44 rounded-2xl bg-white p-2" />
                      ) : null}
                      <button
                        className="btn btn-ink"
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(localPayload);
                          setCopied(true);
                          window.setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? "PIX copiado" : "Copiar PIX"}
                      </button>
                    </div>
                  ) : null}
                  {firstPay === "pix" && USE_ASAAS ? (
                    <p className="text-sm text-muted">
                      Ao continuar, geramos um PIX Asaas. O plano ativa automaticamente após a confirmação.
                    </p>
                  ) : null}
                </div>

                {error ? <p className="text-sm text-negative">{error}</p> : null}
                <button className="btn btn-primary" disabled={busy}>
                  {busy
                    ? "Salvando…"
                    : firstPay === "pix"
                      ? USE_ASAAS
                        ? `Gerar PIX · ${selected.price}`
                        : "Confirmei o PIX · ativar plano"
                      : `Assinar ${selected.name} · ${selected.price}`}
                </button>
                {firstPay === "pix" && !USE_ASAAS ? (
                  <p className="text-xs text-muted">
                    A confirmação do PIX é sua responsabilidade neste momento (sem gateway externo no Pages).
                  </p>
                ) : null}
              </form>
            )}
          </article>
        ) : (
          <article className="card p-6 space-y-3">
            <p className="kicker">Renovação</p>
            <h3 className="font-bold text-lg">Tudo certo</h3>
            <p className="text-sm text-muted">
              Todo mês a plataforma renova {selected.price} com este cartão. Você cancela sozinho quando quiser.
            </p>
            <Link href="/app" className="btn btn-primary w-fit">
              Abrir o painel
            </Link>
          </article>
        )}
      </div>
    </div>
  );
}
