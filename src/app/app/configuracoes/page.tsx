"use client";

import { useEffect, useState } from "react";
import { currentUser, listLogs, listWorkspaces, requireSession, setSessionWorkspaceId, loadDb, saveDb } from "@/lib/store";
import { provisionWorkspace } from "@/lib/workspace";
import { go } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState(currentUser());
  const [workspaces, setWorkspaces] = useState(user ? listWorkspaces(user.id) : []);
  const [logs, setLogs] = useState(user ? listLogs(user.id) : []);

  useEffect(() => {
    const session = requireSession();
    if (!session) {
      go("/login");
      return;
    }
    setUser(session.user);
    setWorkspaces(listWorkspaces(session.user.id));
    setLogs(listLogs(session.user.id));
  }, []);

  if (!user) return null;
  const hasPersonal = workspaces.some((w) => w.type === "PERSONAL");
  const hasBusiness = workspaces.some((w) => w.type === "BUSINESS");

  function addProfile(type: "PERSONAL" | "BUSINESS") {
    if (!user) return;
    const ws = provisionWorkspace(user.id, type === "PERSONAL" ? "Pessoal" : "Empresa", type);
    const db = loadDb();
    const me = db.users.find((u) => u.id === user.id);
    if (me) me.lastWorkspaceId = ws.id;
    saveDb(db);
    setSessionWorkspaceId(ws.id);
    go("/app");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <p className="text-sm text-muted">Perfis separados. Pessoal e empresa não misturam lançamentos.</p>
      </div>
      <div className="card p-6 space-y-3">
        <div className="text-sm">Conta: {user.name} · {user.email}</div>
        <ul className="text-sm text-muted space-y-1">
          {workspaces.map((ws) => (
            <li key={ws.id}>{ws.type === "BUSINESS" ? "Empresa" : "Pessoal"} — {ws.name}</li>
          ))}
        </ul>
        <div className="flex gap-2 flex-wrap pt-2">
          {!hasPersonal ? <button className="btn btn-ghost" onClick={() => addProfile("PERSONAL")}>Criar perfil pessoal</button> : null}
          {!hasBusiness ? <button className="btn btn-ghost" onClick={() => addProfile("BUSINESS")}>Criar perfil empresarial</button> : null}
        </div>
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
