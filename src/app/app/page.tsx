"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/shell";
import { cashBalance, pipelineValue, requireSession, setAutopilot, type Snapshot } from "@/lib/store";
import { runAutopilot } from "@/lib/pilot";
import { useLive } from "@/lib/live";
import { brl } from "@/lib/money";
import { DEPARTMENTS, go } from "@/lib/types";
import { planLabel } from "@/lib/plans";
import { displayCompany, formatCnpj } from "@/lib/company";

const HREF: Record<string, string> = {
  DIRECAO: "/app",
  PESSOAS: "/app/pessoas",
  VENDAS: "/app/vendas",
  OPS: "/app/projetos",
  CAIXA: "/app/caixa",
  ESTOQUE: "/app/estoque",
  MARKETING: "/app/vendas",
  SUPORTE: "/app/pessoas",
};

export default function PainelPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [applied, setApplied] = useState(0);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setData(session);
      if (session.org.autopilot) {
        const result = await runAutopilot(session);
        setApplied(result.applied);
        const again = await requireSession();
        if (again) setData(again);
      }
    })();
  }, [live]);

  if (!data) return <p className="text-sm text-muted">Carregando o painel…</p>;
  const cash = cashBalance(data);
  const pipe = pipelineValue(data);
  const openTasks = data.tasks.filter((task) => task.status !== "DONE").length;

  return (
    <div>
      <PageHead
        kicker={displayCompany(data.org)}
        title="A empresa, agora."
        subtitle={`${data.org.legalName} · CNPJ ${formatCnpj(data.org.cnpj)}. A IA olha os setores e cria as tarefas seguras sozinha. Pagar e demitir continuam com você.`}
        extra={
          <button className="pilot" type="button" onClick={() => void setAutopilot(!data.org.autopilot)}>
            <i className="dot" />
            {data.org.autopilot ? "IA ligada · 95%" : "IA pausada"}
          </button>
        }
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Pessoas" value={String(data.people.length)} href="/app/pessoas" />
        <Kpi label="Pipeline" value={brl(pipe)} href="/app/vendas" />
        <Kpi label="Caixa" value={brl(cash)} href="/app/caixa" tone={cash < 0 ? "bad" : "ok"} />
        <Kpi label="Tarefas abertas" value={String(openTasks)} href="/app/projetos" />
      </div>

      {applied > 0 ? (
        <p className="chip ok mb-4">A IA acabou de criar {applied} tarefa(s) sozinha.</p>
      ) : null}

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <article className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">O que a IA fez</h2>
            <Link href="/app/ia" className="text-sm underline">
              Conversar
            </Link>
          </div>
          <ul className="mt-3 space-y-3">
            {data.logs.slice(0, 5).map((log) => (
              <li key={log.id}>
                <div className="flex items-center gap-2">
                  <span className={`chip ${log.kind === "ask" ? "warn" : log.kind === "done" ? "ok" : ""}`}>
                    {log.kind === "done" ? "fez" : log.kind === "ask" ? "pede você" : "olhou"}
                  </span>
                  <strong className="text-sm">{log.title}</strong>
                </div>
                <p className="text-sm text-muted mt-1">{log.body}</p>
              </li>
            ))}
            {!data.logs.length ? <p className="text-sm text-muted">Ainda quieta. Cadastre gente, uma venda ou um boleto.</p> : null}
          </ul>
        </article>
        <article className="card p-5">
          <h2 className="font-bold">Setores</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {DEPARTMENTS.map((item) => (
              <Link key={item.id} href={HREF[item.id]} className="rounded-2xl border border-line p-4 hover:border-gold">
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-muted mt-1">{item.does}</div>
              </Link>
            ))}
          </div>
        </article>
      </div>
      <p className="text-xs text-muted">{planLabel(data.user)} · Finanças CodeCraft</p>
    </div>
  );
}

function Kpi({
  label,
  value,
  href,
  tone,
}: {
  label: string;
  value: string;
  href: string;
  tone?: "ok" | "bad";
}) {
  return (
    <Link href={href} className="card p-5">
      <div className="kicker">{label}</div>
      <div className={`text-2xl font-extrabold mt-2 ${tone === "bad" ? "text-negative" : ""}`}>{value}</div>
    </Link>
  );
}
