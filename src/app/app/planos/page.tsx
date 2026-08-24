"use client";

import { useEffect, useState } from "react";
import { PageHead } from "@/components/shell";
import { requireSession, setPlan, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go, type PlanId } from "@/lib/types";
import { PIX_KEY, PLANS } from "@/lib/plans";

export default function PlanosPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHead
        kicker="Assinatura"
        title="Planos"
        subtitle={`PIX ${PIX_KEY}. Renova todo mês. Depois do PIX, escolha o plano aqui.`}
      />
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const active = data.user.plan === plan.id;
          return (
            <article key={plan.id} className={`card p-6 flex flex-col ${plan.highlight ? "ring-2 ring-[color:var(--gold)]" : ""}`}>
              {active ? <span className="chip ok w-fit">Atual</span> : plan.badge ? <span className="chip warn w-fit">{plan.badge}</span> : null}
              <h3 className="font-bold text-lg mt-2">{plan.name}</h3>
              <div className="text-3xl font-extrabold mt-2">{plan.price}</div>
              <p className="text-xs text-muted">{plan.period}</p>
              <p className="text-sm text-muted mt-3">{plan.forWho}</p>
              <ul className="text-sm mt-4 space-y-1.5 flex-1">
                {plan.includes.map((line) => (
                  <li key={line}>· {line}</li>
                ))}
              </ul>
              <button
                className={`btn mt-5 ${active ? "btn-ghost" : "btn-primary"}`}
                disabled={active}
                onClick={() => void setPlan(plan.id as PlanId)}
              >
                {active ? "Este é o seu" : plan.cta}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
