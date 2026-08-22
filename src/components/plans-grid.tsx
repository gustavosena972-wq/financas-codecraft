"use client";

import Link from "next/link";
import { PIX_PLAN_KEY, PLANS, type Plan, type PlanId } from "@/lib/plans";

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
  const active = current === plan.id;

  return (
    <article className={`card p-6 flex flex-col price-card ${plan.highlight ? "featured" : ""}`}>
      {plan.badge ? <span className="price-badge">{plan.badge}</span> : null}
      <div className="min-h-5">
        {active ? <span className="text-[11px] font-semibold text-gold">Plano atual</span> : <span />}
      </div>
      <h3 className="font-bold text-lg mt-1">{plan.name}</h3>
      <div className="mt-3">
        <div className="text-3xl font-extrabold font-mono">{plan.price}</div>
        <div className="text-xs text-muted">{plan.period}</div>
      </div>
      <p className="text-sm text-muted mt-3">{plan.forWho}</p>
      <ul className="text-sm mt-4 space-y-1.5 flex-1 price-list">
        {plan.includes.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {mode === "account" && onSelect ? (
        <button
          className={`btn mt-5 w-full ${active ? "btn-ghost" : "btn-primary"}`}
          disabled={active}
          onClick={() => onSelect(plan.id)}
        >
          {active ? "Este é o seu plano" : plan.cta}
        </button>
      ) : (
        <Link href="/cadastro" className={`btn mt-5 w-full ${plan.highlight ? "btn-primary" : "btn-ink"}`}>
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
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        {PLANS.map((plan) => (
          <Card key={plan.id} plan={plan} current={current} onSelect={onSelect} mode={mode} />
        ))}
      </div>
      <p className="text-sm text-muted">
        Todo mês cobra de novo. PIX <strong>{PIX_PLAN_KEY}</strong> — é a mesma chave dos projetos da CodeCraft.
        Se mandarem outra, não pague. O chat não pede senha e não mexe no dinheiro.
      </p>
    </div>
  );
}
