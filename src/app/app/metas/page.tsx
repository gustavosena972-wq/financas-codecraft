"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listGoals, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { accountBalances } from "@/lib/queries";
import { brl } from "@/lib/money";
import { ActionForm } from "@/components/action-form";
import { createGoalAction, deleteGoalAction } from "@/app/actions/extras";
import { go } from "@/lib/types";
import { goalLimit } from "@/lib/plans";

export default function GoalsPage() {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [limit, setLimit] = useState(1);
  const [balance, setBalance] = useState(0);
  const [goals, setGoals] = useState<ReturnType<typeof listGoals>>([]);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setGoals(listGoals(session.workspace.id));
      setBalance(accountBalances(session.workspace.id).reduce((sum, account) => sum + account.balance, 0));
      setLimit(goalLimit(session.user.plan));
      setReady(true);
    })();
  }, [live]);

  if (!ready) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Metas</h1>
        <p className="text-sm text-muted">
          Um alvo de caixa. O progresso usa o saldo atual das contas. No Free cabe {Number.isFinite(limit) ? limit : "várias"}.
          {Number.isFinite(limit) ? (
            <>
              {" "}
              <Link href="/app/planos">Atualize o plano</Link> para ter mais.
            </>
          ) : null}
        </p>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const pct = Math.min(100, Math.round((balance / Math.max(goal.target, 1)) * 100));
          return (
            <article key={goal.id} className="card p-5 space-y-3">
              <div className="flex justify-between gap-3">
                <h2 className="font-semibold">{goal.name}</h2>
                <button
                  className="text-xs text-muted"
                  onClick={async () => {
                    await deleteGoalAction(goal.id);
                  }}
                >
                  Excluir
                </button>
              </div>
              <p className="text-sm text-muted">Até {new Date(`${goal.deadline}T12:00:00`).toLocaleDateString("pt-BR")}</p>
              <div className="text-xl font-semibold">
                {brl(balance)} / {brl(goal.target)}
              </div>
              <div className="h-2 rounded-full bg-bg-2 overflow-hidden">
                <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-muted">{pct}% do alvo, com o saldo de agora.</p>
            </article>
          );
        })}
      </div>
      <div className="card p-6">
        <h2 className="font-semibold mb-4">Nova meta</h2>
        <ActionForm action={createGoalAction} className="grid sm:grid-cols-3 gap-3" submitLabel="Guardar meta">
          <label className="field">
            <span>Nome</span>
            <input name="name" required placeholder="Reserva de emergência" />
          </label>
          <label className="field">
            <span>Quanto</span>
            <input name="target" required placeholder="5000,00" />
          </label>
          <label className="field">
            <span>Até</span>
            <input name="deadline" type="date" required />
          </label>
        </ActionForm>
      </div>
    </div>
  );
}
