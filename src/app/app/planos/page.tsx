"use client";

import { useEffect, useState } from "react";
import { PlansGrid } from "@/components/plans-grid";
import { planById, type PlanId } from "@/lib/plans";
import { requireSession, setUserPlan } from "@/lib/store";
import { go } from "@/lib/types";

export default function PlanosPage() {
  const [plan, setPlan] = useState<PlanId>("FREE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setPlan(session.user.plan);
    })();
  }, []);

  async function updatePlan(next: PlanId) {
    setBusy(true);
    setMessage(null);
    try {
      await setUserPlan(next);
      setPlan(next);
      const chosen = planById(next);
      setMessage(`Plano atualizado para ${chosen.name}.`);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Não deu para atualizar o plano agora.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planos</h1>
        <p className="text-sm text-muted max-w-2xl">
          Atualize o plano quando quiser. O Free já organiza a planilha, mostra a agenda e deixa 3 recorrentes e 1 meta.
          O Pro sobe de verdade: IA, recorrentes e metas sem limite.
        </p>
      </div>
      <div className={busy ? "pointer-events-none opacity-70" : ""}>
        <PlansGrid mode="account" current={plan} onSelect={(id) => void updatePlan(id)} />
      </div>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
      <p className="text-xs text-muted">
        A cobrança ainda não está ligada. Por agora você escolhe o plano para ver o que vem nele.
      </p>
    </div>
  );
}
