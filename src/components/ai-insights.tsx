import Link from "next/link";
import type { Insight } from "@/lib/ai";

export function AiInsights({
  unlocked,
  insights,
}: {
  unlocked: boolean;
  insights: Insight[];
}) {
  if (!unlocked) {
    return (
      <section className="card p-5 border-dashed">
        <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">IA operacional</p>
        <h2 className="font-semibold mt-1">Explicar o mês, no Pro</h2>
        <p className="text-sm text-muted mt-2">
          A IA lê os seus números, avisa desvio de orçamento e sugere categoria. Sem chat no meio do caminho.
        </p>
        <Link href="/app/planos" className="btn btn-primary mt-4">
          Atualizar plano
        </Link>
      </section>
    );
  }

  return (
    <section className="card p-5">
      <p className="text-[11px] uppercase tracking-wide text-gold font-semibold">IA operacional</p>
      <h2 className="font-semibold mt-1 mb-4">O que os números estão dizendo</h2>
      <ul className="space-y-3">
        {insights.map((item) => (
          <li key={item.title} className="border-b border-line last:border-0 pb-3 last:pb-0">
            <div className={`text-sm font-semibold ${item.tone === "warn" ? "text-negative" : item.tone === "ok" ? "text-positive" : ""}`}>
              {item.title}
            </div>
            <p className="text-sm text-muted mt-1">{item.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
