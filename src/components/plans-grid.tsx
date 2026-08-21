"use client";

import Link from "next/link";
import { PIX_PLAN_KEY, PLANS, type Plan, type PlanAudience, type PlanId } from "@/lib/plans";

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
    <article className={`card p-5 flex flex-col ${plan.highlight ? "ring-2 ring-gold" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-semibold">{plan.name}</h3>
        {active ? <span className="text-[11px] font-semibold text-gold">Plano atual</span> : null}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold">{plan.price}</div>
        <div className="text-xs text-muted">{plan.period}</div>
      </div>
      <p className="text-sm text-muted mt-3">{plan.forWho}</p>
      <ul className="text-sm mt-4 space-y-1.5 flex-1">
        {plan.includes.map((item) => (
          <li key={item}>• {item}</li>
        ))}
        {plan.news.map((item) => (
          <li key={item}>
            <span className="text-[10px] uppercase tracking-wide text-gold font-semibold mr-1">Novo</span>
            {item}
          </li>
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
        <Link href="/cadastro" className={`btn mt-5 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}>
          {plan.id === "FREE" ? "Começar grátis" : "Criar conta"}
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
  audience: PlanAudience;
  current?: PlanId;
  onSelect?: (id: PlanId) => void;
  mode: "public" | "account";
}) {
  const list = PLANS.filter((p) => p.audience === audience);
  return (
    <section className="space-y-4">
      <div>
        <p className="page-kicker">{audience === "person" ? "Pessoa" : "Empresa"}</p>
        <h2 className="text-xl font-semibold mt-1">{title}</h2>
        <p className="text-sm text-muted mt-1">{body}</p>
      </div>
      <div className={`grid gap-4 ${list.length === 2 ? "md:grid-cols-2" : "md:grid-cols-2 xl:grid-cols-4"}`}>
        {list.map((plan) => (
          <Card key={plan.id} plan={plan} current={current} onSelect={onSelect} mode={mode} />
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
        title="Planos para pessoa"
        body={`Chat, alerta do mês e educação. PIX ${PIX_PLAN_KEY}.`}
        audience="person"
        current={current}
        onSelect={onSelect}
        mode={mode}
      />
      <Group
        title="Planos para empresa"
        body={`Chat do caixa, títulos, DRE e giro. Não mistura com o pessoal. PIX ${PIX_PLAN_KEY}.`}
        audience="company"
        current={current}
        onSelect={onSelect}
        mode={mode}
      />
      <p className="text-sm text-muted">
        Todo pagamento cai na chave PIX <strong>{PIX_PLAN_KEY}</strong>. Se mandarem outra chave, não pague.
      </p>
    </div>
  );
}
