"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FINANCE_KNOWLEDGE, searchKnowledge } from "@/lib/finance-knowledge";
import { go } from "@/lib/types";

export default function EducacaoPage() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(FINANCE_KNOWLEDGE[0]?.id ?? null);
  const list = useMemo(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) return FINANCE_KNOWLEDGE;
    const hits = searchKnowledge(trimmed, 12);
    return hits.length ? hits : FINANCE_KNOWLEDGE.filter((item) =>
      `${item.title} ${item.body} ${item.tags.join(" ")}`.toLowerCase().includes(trimmed.toLowerCase()),
    );
  }, [q]);

  function ask(title: string) {
    sessionStorage.setItem("fc-ask", title);
    go("/app");
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="page-kicker">Educação</p>
        <h1 className="text-2xl font-semibold mt-1">Dinheiro e contabilidade, em português claro</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">
          Reserva, orçamento, cartão, DRE, MEI, imposto. O chat usa este mesmo banco. Aqui você lê no seu ritmo.
        </p>
      </div>
      <label className="field max-w-lg">
        <span>Buscar</span>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: reserva, cartão, DRE, aluguel" />
      </label>
      <div className="grid gap-3">
        {list.map((item) => {
          const on = open === item.id;
          return (
            <article key={item.id} className="card p-5">
              <button type="button" className="w-full text-left" onClick={() => setOpen(on ? null : item.id)}>
                <h2 className="font-semibold">{item.title}</h2>
                {!on ? <p className="text-sm text-muted mt-1 line-clamp-2">{item.body}</p> : null}
              </button>
              {on ? (
                <div className="mt-3 space-y-3">
                  <p className="text-sm leading-relaxed">{item.body}</p>
                  <button type="button" className="btn btn-ink" onClick={() => ask(`Me explica ${item.title} com os meus números`)}>
                    Perguntar no chat
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
        {!list.length ? <p className="text-sm text-muted">Nada com esse termo. Tente reserva, dívida, DRE ou MEI.</p> : null}
      </div>
      <p className="text-sm text-muted">
        Isto orienta organização. Declaração formal e contrato pesado são com contador.{" "}
        <Link href="/app" className="underline">
          Chat
        </Link>
      </p>
    </div>
  );
}
