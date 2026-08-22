"use client";

import { useEffect, useState } from "react";
import { listLogs, requireSession } from "@/lib/store";
import { useLive } from "@/lib/live";
import { planHasGovernance } from "@/lib/plans";
import { PageHeader, PlanGate } from "@/components/page-header";
import { go } from "@/lib/types";

export default function AuditoriaPage() {
  const live = useLive();
  const [ok, setOk] = useState(false);
  const [logs, setLogs] = useState<ReturnType<typeof listLogs>>([]);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setOk(planHasGovernance(session.user.plan));
      setLogs(listLogs(session.user.id));
    })();
  }, [live]);

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Empresa"
        title="Auditoria"
        subtitle="Quem lançou, quem baixou, quem mudou. Trilha para o dono e para o contador."
      />
      <PlanGate allowed={ok} title="Auditoria entra no Completo" body="A trilha de quem fez o quê fica no plano Completo (R$ 400)." />
      {ok ? (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Ação</th>
                <th>Entidade</th>
                <th>Detalhe</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString("pt-BR")}</td>
                  <td>{log.action}</td>
                  <td>{log.entity}</td>
                  <td>{log.detail ?? "—"}</td>
                </tr>
              ))}
              {!logs.length ? (
                <tr>
                  <td colSpan={4} className="text-muted">Nenhum evento ainda.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
