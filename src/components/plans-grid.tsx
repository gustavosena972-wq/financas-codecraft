"use client";

import Link from "next/link";
import { PIX_PLAN_KEY, plansFor, type Plan, type PlanId } from "@/lib/plans";

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
  const active = current === plan.id && plan.id !== "FREE" ? true : current === "FREE" && plan.id === "FREE";
  const isFree = plan.id === "FREE";
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
      {mode === "account" && onSelect ? (
        <button
          className={`btn mt-5 w-full ${active ? "btn-ghost" : "btn-primary"}`}
          disabled={active}
          onClick={() => onSelect(plan.id)}
        >
          {active ? "Este é o seu plano" : plan.cta}
        </button>
      ) : (
        <Link href={isFree ? "/cadastro" : "/cadastro"} className={`btn mt-5 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}>
          {plan.cta}
        </Link>
      )}
    </article>
  );
}

function Group({
  title,
  body,
  audience,
  current,
  onSelect,
  mode,
}: {
  title: string;
  body: string;
  audience: "person" | "company";
  current?: PlanId;
  onSelect?: (id: PlanId) => void;
  mode: "public" | "account";
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="page-kicker">{audience === "person" ? "Pessoa" : "Empresa"}</p>
        <h2 className="text-xl font-semibold mt-1">{title}</h2>
        <p className="text-sm text-muted mt-1">{body}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {plansFor(audience).map((plan) => (
          <Card key={`${plan.audience}-${plan.id}`} plan={plan} current={current} onSelect={onSelect} mode={mode} />
        ))}
      </div>
    </section>
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
    <div className="space-y-12">
      <Group
        title="Três pacotes da pessoa"
        body="O chat é o mesmo. O que muda são as ferramentas da vida pessoal."
        audience="person"
        current={current}
        onSelect={onSelect}
        mode={mode}
      />
      <Group
        title="Três pacotes da empresa"
        body="Espaço separado. Ferramentas de caixa, DRE e giro — pessoa não usa isso."
        audience="company"
        current={current}
        onSelect={onSelect}
        mode={mode}
      />
      <p className="text-sm text-muted">
        PIX <strong>{PIX_PLAN_KEY}</strong>. Se mandarem outra chave, não pague.
      </p>
    </div>
  );
}
