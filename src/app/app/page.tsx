"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHead } from "@/components/shell";
import { cashBalance, dreSummary, requireSession, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { brl } from "@/lib/money";
import { DEPARTMENTS, go } from "@/lib/types";
import { planLabel } from "@/lib/plans";
import { displayCompany, formatCnpj } from "@/lib/company";

const HREF: Record<string, string> = {
  DIRECAO: "/app",
  FINANCEIRO: "/app/financeiro",
  PESSOAS: "/app/pessoas",
  OPERACOES: "/app",
  COMERCIAL: "/app/financeiro",
  SUPORTE: "/app/pessoas",
};

export default function PainelPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return <p className="text-sm text-muted">Carregando o painel…</p>;
  const cash = cashBalance(data);
  const dre = dreSummary(data);
  const openBills = data.bills.filter((bill) => bill.status === "OPEN").length;

  return (
    <div>
      <PageHead
        kicker={displayCompany(data.org)}
        title="Painel da empresa"
        subtitle={`${data.org.legalName} · CNPJ ${formatCnpj(data.org.cnpj)}. Financeiro, pessoas e assinatura no mesmo lugar — sem IA no painel.`}
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Caixa" value={brl(cash)} href="/app/financeiro" tone={cash < 0 ? "bad" : "ok"} />
        <Kpi label="Resultado (DRE)" value={brl(dre.result)} href="/app/financeiro" tone={dre.result < 0 ? "bad" : undefined} />
        <Kpi label="Títulos abertos" value={String(openBills)} href="/app/financeiro" />
        <Kpi label="Colaboradores" value={String(data.people.length)} href="/app/pessoas" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4 mb-6">
        <article className="card p-5">
          <h2 className="font-bold">DRE gerencial</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Receitas</dt>
              <dd className="text-positive font-semibold">{brl(dre.revenue)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Despesas</dt>
              <dd className="text-negative font-semibold">{brl(dre.expense)}</dd>
            </div>
            <div className="flex justify-between border-t border-line pt-2">
              <dt className="font-bold">Resultado</dt>
              <dd className={`font-extrabold ${dre.result < 0 ? "text-negative" : ""}`}>{brl(dre.result)}</dd>
            </div>
          </dl>
          <Link href="/app/financeiro" className="btn btn-ink mt-4 w-fit">
            Abrir financeiro
          </Link>
        </article>
        <article className="card p-5">
          <h2 className="font-bold">Módulos</h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-3">
            {DEPARTMENTS.map((item) => (
              <Link key={item.id} href={HREF[item.id] ?? "/app"} className="rounded-2xl border border-line p-4 hover:border-[color:var(--gold)]">
                <div className="font-bold">{item.name}</div>
                <div className="text-sm text-muted mt-1">{item.does}</div>
              </Link>
            ))}
          </div>
        </article>
      </div>
      <p className="text-xs text-muted">{planLabel(data.user)} · CodeCraft Gestão</p>
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
