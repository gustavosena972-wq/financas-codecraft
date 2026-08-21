"use client";

import { useEffect, useMemo, useState } from "react";
import { PlansGrid } from "@/components/plans-grid";
import { PixPay } from "@/components/pix-pay";
import { planById, type PlanId } from "@/lib/plans";
import { requireSession, setUserPlan } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, newId } from "@/lib/types";
import { whatsappLink } from "@/lib/pix";

export default function PlanosPage() {
  const live = useLive();
  const [plan, setPlan] = useState<PlanId>("FREE");
  const [checkout, setCheckout] = useState<PlanId | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const txid = useMemo(() => `FC${newId().replace(/-/g, "").slice(0, 18).toUpperCase()}`, [checkout]);
  const chosen = checkout ? planById(checkout) : null;

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setPlan(session.user.plan);
    })();
  }, [live]);

  async function onSelect(next: PlanId) {
    if (next === "FREE") {
      setBusy(true);
      try {
        await setUserPlan("FREE");
        setPlan("FREE");
        setCheckout(null);
        setMessage("Voltou para o Free.");
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
      await setUserPlan(checkout);
      setPlan(checkout);
      setMessage(`Pagamento informado. O PIX foi para 31999758385. O plano ${planById(checkout).name} ficou ativo neste login. Envie o comprovante no WhatsApp se quiser conferência.`);
      setCheckout(null);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não deu para registrar agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planos</h1>
        <p className="text-sm text-muted max-w-2xl">
          Pessoa: grátis, R$ 100 e R$ 200. Empresa: grátis, R$ 100 e R$ 200. O chat é igual; as ferramentas é que mudam.
        </p>
      </div>
      <div className={busy ? "pointer-events-none opacity-70" : ""}>
        <PlansGrid mode="account" current={plan} onSelect={(id) => void onSelect(id)} />
      </div>
      {chosen && chosen.priceValue ? (
        <div className="space-y-4">
          <PixPay amount={chosen.priceValue} txid={txid} label={`Plano ${chosen.name} · mensal`} />
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" disabled={busy} onClick={() => void confirmPaid()}>
              Já paguei este PIX
            </button>
            <a className="btn btn-ghost" href={whatsappLink(`Olá! Paguei o plano ${chosen.name} no PIX 31999758385.`)}>
              Mandar comprovante no WhatsApp
            </a>
            <button className="btn btn-ghost" onClick={() => setCheckout(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
