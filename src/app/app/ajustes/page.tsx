"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageHead } from "@/components/shell";
import { cancelCardSubscription, requireSession, setAutopilot, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { isSubscribed, planLabel } from "@/lib/plans";
import { displayCompany, formatCnpj, orgIsLinked } from "@/lib/company";

export default function AjustesPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;
  const org = data.org;
  const linked = orgIsLinked(org);

  return (
    <div className="space-y-6">
      <PageHead kicker="Conta" title="Ajustes" subtitle="A conta é sua. A empresa ligada é o CNPJ gravado no Finanças CodeCraft." />
      <article className="card p-6 space-y-2">
        <p className="kicker">Você</p>
        <p className="font-bold text-lg">{data.user.name}</p>
        <p className="text-sm text-muted">{data.user.email}</p>
        <p className="text-sm">{planLabel(data.user)}</p>
        {isSubscribed(data.user) ? (
          <>
            <p className="text-sm text-muted">
              {data.user.billingMethod === "pix"
                ? "Cobrança da plataforma no PIX"
                : `Cartão •••• ${data.user.cardLast4} · cobrança automática todo mês`}
            </p>
            <Link href="/app/planos" className="btn btn-ink w-fit mt-2">
              Ver cobrança
            </Link>
            <button
              className="btn btn-ghost w-fit"
              type="button"
              onClick={() => void cancelCardSubscription()}
            >
              Cancelar assinatura
            </button>
          </>
        ) : (
          <Link href="/app/planos" className="btn btn-primary w-fit mt-2">
            Assinar a plataforma
          </Link>
        )}
      </article>
      <article className="card p-6 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="kicker">Empresa</p>
          <span className={`chip ${linked ? "ok" : "warn"}`}>{linked ? "ligada" : "não ligada"}</span>
        </div>
        <p className="font-bold text-lg">{displayCompany(org)}</p>
        {linked ? (
          <>
            <p className="text-sm">{org.legalName}</p>
            <p className="text-sm text-muted">CNPJ {formatCnpj(org.cnpj)}</p>
            <p className="text-sm text-muted">
              {[org.street, org.number, org.district, org.city, org.state].filter(Boolean).join(" · ")}
            </p>
            <p className="text-sm text-muted">Responsável {org.legalRep}</p>
          </>
        ) : (
          <p className="text-sm text-muted">Sem CNPJ a plataforma não abre os setores. Ligue a empresa primeiro.</p>
        )}
        <Link href="/app/empresa" className="btn btn-primary w-fit mt-2">
          {linked ? "Atualizar dados" : "Ligar empresa"}
        </Link>
        <button className="pilot mt-2" type="button" onClick={() => void setAutopilot(!org.autopilot)}>
          <i className="dot" />
          {org.autopilot ? "IA autônoma ligada" : "IA pausada"}
        </button>
      </article>
    </div>
  );
}
