"use client";

import { useEffect, useState } from "react";
import { listTeam, requireSession } from "@/lib/store";
import { planHasGovernance, teamLimit } from "@/lib/plans";
import { createSeatAction, deleteSeatAction } from "@/app/actions/enterprise";
import { ActionForm } from "@/components/action-form";
import { PageHeader, PlanGate } from "@/components/page-header";
import { go } from "@/lib/types";

const ROLE = { ADMIN: "Admin", FINANCE: "Financeiro", VIEW: "Leitura" };

export default function EquipePage() {
  const [ok, setOk] = useState(false);
  const [limit, setLimit] = useState(0);
  const [team, setTeam] = useState<ReturnType<typeof listTeam>>([]);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOk(planHasGovernance(session.user.plan) || teamLimit(session.user.plan) > 0);
      setLimit(teamLimit(session.user.plan));
      setTeam(listTeam(session.workspace.id));
    })();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Empresa"
        title="Equipe"
        subtitle="Quem pode ver e lançar nesta operação. Login compartilhado extra combina no Enterprise com a CodeCraft."
      />
      <PlanGate
        allowed={ok}
        title="Equipe entra no Pro"
        body="No Pro cabem 2 assentos. No Business, 8. No Enterprise, sem teto."
      />
      {ok ? (
        <>
          <p className="text-sm text-muted">
            Assentos usados: {team.length}
            {Number.isFinite(limit) ? ` de ${limit}` : " · sem limite"}.
          </p>
          <div className="card p-6">
            <h2 className="font-semibold mb-4">Novo assento</h2>
            <ActionForm action={createSeatAction} className="grid sm:grid-cols-3 gap-3" submitLabel="Registrar">
              <label className="field">
                <span>Nome</span>
                <input name="name" required />
              </label>
              <label className="field">
                <span>E-mail</span>
                <input name="email" type="email" required />
              </label>
              <label className="field">
                <span>Papel</span>
                <select name="role">
                  <option value="FINANCE">Financeiro</option>
                  <option value="ADMIN">Admin</option>
                  <option value="VIEW">Leitura</option>
                </select>
              </label>
            </ActionForm>
          </div>
          <div className="card overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Papel</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {team.map((seat) => (
                  <tr key={seat.id}>
                    <td>{seat.name}</td>
                    <td>{seat.email}</td>
                    <td>{ROLE[seat.role]}</td>
                    <td>
                      <button
                        className="text-xs text-muted"
                        onClick={async () => {
                          await deleteSeatAction(seat.id);
                          window.location.reload();
                        }}
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                {!team.length ? (
                  <tr>
                    <td colSpan={4} className="text-muted">Ninguém além de você neste espaço.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
