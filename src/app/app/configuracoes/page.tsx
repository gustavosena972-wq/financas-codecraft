"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearAuditLogs, listLogs, listWorkspaces, requireSession, setLastWorkspace } from "@/lib/store";
import { wipePlatformHistory } from "@/lib/history";
import { useLive } from "@/lib/live";
import { provisionWorkspace } from "@/lib/workspace";
import { go } from "@/lib/types";
import type { User } from "@/lib/types";
import { planById } from "@/lib/plans";

export default function SettingsPage() {
  const live = useLive();
  const [user, setUser] = useState<Pick<User, "id" | "name" | "email" | "plan"> | null>(null);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; type: "PERSONAL" | "BUSINESS" }[]>([]);
  const [logs, setLogs] = useState<ReturnType<typeof listLogs>>([]);
  const [wiping, setWiping] = useState(false);
  const [wipeMsg, setWipeMsg] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      if (!session) {
        go("/login");
        return;
      }
      setUser(session.user);
      setWorkspaces(listWorkspaces(session.user.id));
      setLogs(listLogs(session.user.id));
    })();
  }, [live]);

  if (!user) return null;
  const hasPersonal = workspaces.some((w) => w.type === "PERSONAL");
  const hasBusiness = workspaces.some((w) => w.type === "BUSINESS");

  async function addProfile(type: "PERSONAL" | "BUSINESS") {
    if (!user) return;
    const ws = await provisionWorkspace(user.id, type === "PERSONAL" ? "Pessoal" : "Empresa", type);
    await setLastWorkspace(user.id, ws.id);
    go("/app");
  }

  async function wipeAll() {
    if (!user) return;
    if (!window.confirm("Apagar o histórico da plataforma? Conversas da IA, pesquisas e a auditoria deste login somem. Contas e lançamentos continuam.")) return;
    setWiping(true);
    setWipeMsg(null);
    try {
      wipePlatformHistory(user.id);
      await clearAuditLogs(user.id);
      setLogs([]);
      setWipeMsg("Histórico apagado. O dinheiro lançado continua.");
    } catch (err) {
      wipePlatformHistory(user.id);
      setLogs([]);
      setWipeMsg(err instanceof Error ? err.message : "Apaguei o que estava neste navegador. A auditoria no servidor pode ter ficado.");
    } finally {
      setWiping(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted">Perfis separados. Pessoal e empresa não misturam lançamentos.</p>
      </div>
      <div className="card p-6 space-y-3">
        <div className="text-sm">Conta: {user.name} · {user.email} · plano {planById(user.plan).name}</div>
        <ul className="text-sm text-muted space-y-1">
          {workspaces.map((ws) => (
            <li key={ws.id}>{ws.type === "BUSINESS" ? "Empresa" : "Pessoal"} — {ws.name}</li>
          ))}
        </ul>
        <div className="flex gap-2 flex-wrap pt-2">
          {!hasPersonal ? <button className="btn btn-ghost" onClick={() => void addProfile("PERSONAL")}>Criar perfil pessoal</button> : null}
          {!hasBusiness ? <button className="btn btn-ghost" onClick={() => void addProfile("BUSINESS")}>Criar perfil empresarial</button> : null}
          <Link className="btn btn-primary" href="/app/planos">Atualizar plano</Link>
        </div>
      </div>
      <div className="card p-6">
        <h2 className="font-semibold mb-1">Histórico da plataforma</h2>
        <p className="text-sm text-muted mb-3">
          Apaga conversas da IA, pesquisas e a trilha de auditoria. Não apaga conta, lançamento nem patrimônio.
        </p>
        <button className="btn btn-ghost" type="button" disabled={wiping} onClick={() => void wipeAll()}>
          {wiping ? "Apagando…" : "Excluir histórico de tudo"}
        </button>
        {wipeMsg ? <p className="text-sm text-muted mt-3">{wipeMsg}</p> : null}
      </div>
      <div className="card p-6">
        <h2 className="font-semibold mb-3">Auditoria recente</h2>
        <ul className="text-sm space-y-2">
          {logs.map((log) => (
            <li key={log.id} className="flex justify-between gap-3 border-b border-line pb-2">
              <span>
                {log.action} {log.entity}
                {log.detail ? ` — ${log.detail}` : ""}
              </span>
              <span className="text-muted whitespace-nowrap">{new Date(log.createdAt).toLocaleString("pt-BR")}</span>
            </li>
          ))}
          {!logs.length ? <li className="text-muted">Sem eventos ainda.</li> : null}
        </ul>
      </div>
    </div>
  );
}
