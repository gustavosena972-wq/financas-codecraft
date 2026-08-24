"use client";

import { useEffect, useState } from "react";
import { Empty, Gate, PageHead } from "@/components/shell";
import { addDeal, removeDeal, requireSession, setDealStage, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { hasOps } from "@/lib/plans";
import { brl, parseMoneyToCents } from "@/lib/money";

const STAGES = [
  { id: "LEAD", name: "Lead" },
  { id: "PROPOSAL", name: "Proposta" },
  { id: "WON", name: "Ganho" },
  { id: "LOST", name: "Perdido" },
] as const;

export default function VendasPage() {
  const live = useLive();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void requireSession().then((session) => {
      if (!session) go("/login");
      else setData(session);
    });
  }, [live]);

  if (!data) return null;
  const ok = hasOps(data.user);

  return (
    <div className="space-y-6">
      <PageHead kicker="Setor" title="Vendas" subtitle="Do primeiro oi até o ganho. A IA cobra lead parado. Fechar o negócio é com você." />
      <Gate allowed={ok} title="Assine para abrir vendas" body="A assinatura da plataforma libera o pipeline inteiro." />
      {ok ? (
        <>
          <form
            className="card p-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const form = new FormData(event.currentTarget);
              const amount = parseMoneyToCents(String(form.get("amount") ?? ""));
              if (amount == null) {
                setError("Valor inválido.");
                return;
              }
              try {
                await addDeal({
                  name: String(form.get("name")),
                  customer: String(form.get("customer")),
                  amount: Math.abs(amount),
                  stage: "LEAD",
                  ownerName: String(form.get("owner") ?? ""),
                  dueAt: String(form.get("due") ?? ""),
                });
                event.currentTarget.reset();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Não deu para salvar.");
              }
            }}
          >
            <label className="field">
              <span>Oportunidade</span>
              <input name="name" required placeholder="Site da clínica" />
            </label>
            <label className="field">
              <span>Cliente</span>
              <input name="customer" required />
            </label>
            <label className="field">
              <span>Valor</span>
              <input name="amount" required placeholder="8000" />
            </label>
            <label className="field">
              <span>Dono</span>
              <input name="owner" />
            </label>
            <label className="field">
              <span>Previsão</span>
              <input name="due" type="date" />
            </label>
            <div className="flex items-end">
              <button className="btn btn-primary">Abrir venda</button>
            </div>
            {error ? <p className="text-sm text-negative sm:col-span-2">{error}</p> : null}
          </form>
          <div className="grid md:grid-cols-4 gap-3">
            {STAGES.map((stage) => {
              const rows = data.deals.filter((deal) => deal.stage === stage.id);
              return (
                <section key={stage.id} className="card p-4 min-h-48">
                  <h2 className="font-bold flex items-center justify-between">
                    {stage.name}
                    <span className="chip">{rows.length}</span>
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {rows.map((deal) => (
                      <li key={deal.id} className="rounded-xl border border-line p-3">
                        <div className="font-semibold text-sm">{deal.name}</div>
                        <div className="text-xs text-muted">{deal.customer}</div>
                        <div className="text-sm mt-1">{brl(deal.amount)}</div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {STAGES.filter((item) => item.id !== deal.stage).map((item) => (
                            <button key={item.id} className="chip" type="button" onClick={() => void setDealStage(deal.id, item.id)}>
                              {item.name}
                            </button>
                          ))}
                          <button className="chip bad" type="button" onClick={() => void removeDeal(deal.id)}>
                            tirar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
          {!data.deals.length ? <Empty title="Pipeline vazio" body="Abre a primeira venda. A IA avisa se o lead dormir uma semana." /> : null}
        </>
      ) : null}
    </div>
  );
}
