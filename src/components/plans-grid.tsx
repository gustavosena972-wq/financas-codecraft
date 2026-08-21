"use client";

import Link from "next/link";
import { PLANS, type PlanId } from "@/lib/plans";

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
    <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
      {PLANS.map((plan) => {
        const active = current === plan.id;
        return (
          <article
            key={plan.id}
            className={`card p-5 flex flex-col ${plan.highlight ? "ring-2 ring-gold" : ""}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{plan.name}</h3>
              {active ? (
                <span className="text-[11px] font-semibold text-gold">Plano atual</span>
              ) : null}
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
                  <span className="text-[10px] uppercase tracking-wide text-gold font-semibold mr-1">
                    Novo
                  </span>
                  {item}
                </li>
              ))}
            </ul>
            {mode === "account" && onSelect ? (
              <button
                className={`btn mt-5 w-full ${active ? "btn-ghost" : "btn-primary"}`}
                disabled={active || plan.id === "ENTERPRISE"}
                onClick={() => onSelect(plan.id)}
              >
                {plan.id === "ENTERPRISE" ? "Em breve" : active ? "Este é o seu plano" : plan.cta}
              </button>
            ) : (
              <Link href="/cadastro" className={`btn mt-5 w-full ${plan.highlight ? "btn-primary" : "btn-ghost"}`}>
                {plan.id === "FREE" ? "Começar grátis" : plan.id === "ENTERPRISE" ? "Falar depois" : "Criar conta"}
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}
