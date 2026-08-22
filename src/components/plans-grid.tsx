"use client";

import Link from "next/link";
import { PIX_PLAN_KEY, PLANS, type Plan, type PlanId } from "@/lib/plans";
import { whatsappLink } from "@/lib/pix";

function Card({
  plan,
  current,
  onSelect,
  mode,
}: {
  plan: Plan;
  current?: PlanId;
  onSelect?: (id: PlanId) => void;
  mode: "public" | "account";
}) {
  const shown = current === "PLUS" ? "PRO" : current;
  const active = shown === plan.id;
  const isTalk = plan.id === "ENTERPRISE";
  const talkHref = whatsappLink("Olá! Quero o plano Contador / white-label do Finanças CodeCraft.");

  return (
    <article className={`card p-5 flex flex-col ${plan.highlight ? "ring-2 ring-gold" : ""}`}>
      <div className="flex items-center justify-between gap-2 min-h-5">
        {plan.badge ? (
          <span className="text-[11px] font-semibold text-gold uppercase tracking-wide">{plan.badge}</span>
        ) : (
          <span />
        )}
        {active ? <span className="text-[11px] font-semibold text-gold">Plano atual</span> : null}
      </div>
      <h3 className="font-semibold text-lg mt-1">{plan.name}</h3>
      <div className="mt-3">
        <div className="text-3xl font-semibold">{plan.price}</div>
        <div className="text-xs text-muted">{plan.period}</div>
      </div>
      <p className="text-sm text-muted mt-3">{plan.forWho}</p>
      <ul className="text-sm mt-4 space-y-1.5 flex-1">
        {plan.includes.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
      {isTalk ? (
        <a className="btn btn-primary mt-5 w-full" href={talkHref}>
          {plan.cta}
        </a>
      ) : mode === "account" && onSelect ? (
        <button
          className={`btn mt-5 w-full ${active ? "btn-ghost" : "btn-primary"}`}
          disabled={active}
          onClick={() => onSelect(plan.id)}
        >
          {active ? "Este é o seu plano" : plan.cta}
        </button>
      ) : (
        <Link href="/cadastro" className={`btn mt-5 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}>
          {plan.cta}
        </Link>
      )}
    </article>
  );
}

export function PlansGrid({
  current,
  onSelect,
  mode,
}: {
  current?: PlanId;
  onSelect?: (id: PlanId) => void;
  mode: "public" | "account";
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <Card key={plan.id} plan={plan} current={current} onSelect={onSelect} mode={mode} />
        ))}
      </div>
      <p className="text-sm text-muted">
        PIX <strong>{PIX_PLAN_KEY}</strong>. Se mandarem outra chave, não pague. O chat não pede senha e não mexe no dinheiro.
      </p>
    </div>
  );
}
