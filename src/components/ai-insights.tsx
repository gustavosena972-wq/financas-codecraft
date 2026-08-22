"use client";

import { useState } from "react";
import Link from "next/link";
import type { Insight } from "@/lib/ai";

export function AiInsights({
  unlocked,
  insights,
}: {
  unlocked: boolean;
  insights: Insight[];
}) {
  const [open, setOpen] = useState(0);

  if (!unlocked) {
    return (
      <section className="card p-5 border-dashed rise">
        <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">IA operacional</p>
        <h2 className="font-semibold mt-1">O que o mês está dizendo</h2>
        <p className="text-sm text-muted mt-2">
          A IA lê os seus números e aponta desvio. No assistente ela lista o lançamento, não só o total.
        </p>
        <Link href="/app/planos" className="btn btn-primary mt-4">
          Ver planos
        </Link>
      </section>
    );
  }

  return (
    <section className="card p-5 rise">
      <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">IA operacional</p>
      <h2 className="font-semibold mt-1 mb-4">O que o mês está dizendo</h2>
      <ul className="space-y-2">
        {insights.map((item, i) => {
          const on = open === i;
          return (
            <li key={item.title}>
              <button type="button" className="insight-item w-full text-left" onClick={() => setOpen(on ? -1 : i)}>
                <div className={`text-sm font-semibold ${item.tone === "warn" ? "text-negative" : item.tone === "ok" ? "text-positive" : ""}`}>
                  {item.title}
                </div>
                <p className={`text-sm text-muted mt-1 ${on ? "" : "line-clamp-1"}`}>{item.body}</p>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
