"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PlansGrid } from "@/components/plans-grid";
import { PixPay } from "@/components/pix-pay";
import { planById, planPriceLine, type PlanId } from "@/lib/plans";
import { currentBilling, requireSession, setUserPlan } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, newId } from "@/lib/types";
import { whatsappCardPay, whatsappLink } from "@/lib/pix";
import {
  cardCheckoutUrl,
  formatChargeDate,
  isComingDue,
  isDue,
  startBilling,
  type PayMethod,
} from "@/lib/billing";

export default function PlanosPage() {
  const live = useLive();
  const [plan, setPlan] = useState<PlanId>("FREE");
  const [checkout, setCheckout] = useState<PlanId | null>(null);
  const [method, setMethod] = useState<PayMethod>("pix");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [billing, setBilling] = useState(currentBilling());
  const payRef = useRef<HTMLDivElement>(null);
  const txid = useMemo(() => `FC${newId().replace(/-/g, "").slice(0, 18).toUpperCase()}`, [checkout]);
  const chosen = checkout ? planById(checkout) : null;
  const cardUrl = chosen ? cardCheckoutUrl(chosen.id) : "";

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setPlan(session.user.plan);
      setBilling(currentBilling());
      const params = new URLSearchParams(window.location.search);
      const paidPlan = params.get("plano") as PlanId | null;
      if (params.get("pago") === "1" && paidPlan && paidPlan !== "FREE") {
        setCheckout(paidPlan);
        setMethod("card");
      }
    })();
  }, [live]);

  useEffect(() => {
    if (!checkout) return;
    payRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [checkout]);

  async function onSelect(next: PlanId) {
    if (next === "FREE") {
      setBusy(true);
      try {
        await setUserPlan("FREE", null);
        setPlan("FREE");
        setBilling(null);
        setCheckout(null);
        setMessage("Voltou para Experimentar. A renovação automática parou.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setCheckout(next);
    setMessage(null);
  }

  async function confirmPaid() {
    if (!checkout || checkout === "FREE") return;
    setBusy(true);
    try {
      const next = startBilling(checkout, method);
      await setUserPlan(checkout, next);
      setPlan(checkout);
      setBilling(next);
      setMessage(
        `Pagamento informado. O dinheiro foi para a conta da CodeCraft. O plano ${planById(checkout).name} renova sozinho todo mês, no cartão ou no PIX que você escolheu. Próxima cobrança: ${formatChargeDate(next.nextChargeAt)}.`,
      );
      setCheckout(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não deu para registrar agora.");
    } finally {
      setBusy(false);
    }
  }

  const due = isDue(billing) || isComingDue(billing);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planos</h1>
        <p className="text-sm text-muted max-w-2xl mt-1">{planPriceLine()} Cartão de crédito ou PIX. O valor cai na conta da CodeCraft.</p>
      </div>

      {billing && billing.plan !== "FREE" ? (
        <article className={`card p-5 ${due ? "ring-1 ring-gold" : ""}`}>
          <p className="page-kicker">Assinatura</p>
          <h2 className="font-semibold mt-1">
            {planById(billing.plan).name} · {billing.method === "card" ? "cartão de crédito" : "PIX"}
          </h2>
          <p className="text-sm text-muted mt-2">
            Renovação automática ligada. Próxima cobrança em {formatChargeDate(billing.nextChargeAt)} ·{" "}
            {planById(billing.plan).price}.
          </p>
          {due ? (
            <button className="btn btn-primary mt-3" type="button" onClick={() => setCheckout(billing.plan)}>
              Pagar a renovação agora
            </button>
          ) : null}
        </article>
      ) : null}

      {chosen && chosen.priceValue ? (
        <div ref={payRef} className="space-y-4">
          <div className="card p-5 space-y-3">
            <h2 className="font-semibold">Como você quer pagar o {chosen.name}</h2>
            <p className="text-sm text-muted">
              O PIX é o mesmo da empresa: o valor cai na hora na conta. Cartão: você pede a cobrança no WhatsApp, como nos projetos da CodeCraft.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                className={`btn ${method === "pix" ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={() => setMethod("pix")}
              >
                PIX
              </button>
              <button
                className={`btn ${method === "card" ? "btn-primary" : "btn-ghost"}`}
                type="button"
                onClick={() => setMethod("card")}
              >
                Cartão de crédito
              </button>
            </div>
          </div>

          {method === "pix" ? (
            <PixPay amount={chosen.priceValue} txid={txid} label={`Plano ${chosen.name} · mensal automático`} />
          ) : (
            <article className="card p-6 space-y-3">
              <p className="page-kicker">Cartão de crédito</p>
              <h2 className="font-bold">Cobrança no cartão, na conta da CodeCraft</h2>
              <p className="text-sm text-muted max-w-2xl">
                Não pedimos o número do cartão nesta tela. Você manda no WhatsApp que quer o {chosen.name} no cartão. A CodeCraft cobra {chosen.price} todo mês — o dinheiro cai na mesma conta do PIX.
              </p>
              {cardUrl ? (
                <a className="btn btn-primary" href={cardUrl} target="_blank" rel="noreferrer">
                  Pagar {chosen.price} no cartão
                </a>
              ) : (
                <a className="btn btn-primary" href={whatsappCardPay(chosen.name, chosen.price)}>
                  Pedir cobrança no cartão
                </a>
              )}
              <p className="text-sm text-muted">
                Se quiser pagar agora, use o PIX deste mesmo valor — cai na hora. No mês que vem o app cobra de novo no mesmo dia.
              </p>
              <PixPay amount={chosen.priceValue} txid={txid} label={`Plano ${chosen.name} · mensal`} />
            </article>
          )}

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" type="button" disabled={busy} onClick={() => void confirmPaid()}>
              {method === "card" ? "Já paguei no cartão" : "Já paguei este PIX"}
            </button>
            <a
              className="btn btn-ghost"
              href={whatsappLink(`Olá! Paguei o plano ${chosen.name} (${chosen.price}/mês) na renovação automática.`)}
            >
              Mandar comprovante no WhatsApp
            </a>
            <button className="btn btn-ghost" type="button" onClick={() => setCheckout(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}

      <div className={busy ? "pointer-events-none opacity-70" : ""}>
        <PlansGrid mode="account" current={plan} onSelect={(id) => void onSelect(id)} />
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
