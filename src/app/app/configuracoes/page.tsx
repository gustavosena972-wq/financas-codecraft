import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { provisionWorkspace } from "@/lib/workspace";
import { setActiveWorkspace } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const user = await requireUser();
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  const hasPersonal = workspaces.some((w) => w.type === "PERSONAL");
  const hasBusiness = workspaces.some((w) => w.type === "BUSINESS");
  const logs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

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
            <li key={ws.id}>
              {ws.type === "BUSINESS" ? "Empresa" : "Pessoal"} — {ws.name}
            </li>
          ))}
        </ul>
        <div className="flex gap-2 flex-wrap pt-2">
          {!hasPersonal ? (
            <form
              action={async () => {
                "use server";
                const current = await requireUser();
                const ws = await provisionWorkspace(current.id, "Pessoal", "PERSONAL");
                await setActiveWorkspace(current.id, ws.id);
                redirect("/app");
              }}
            >
              <button className="btn btn-ghost">Criar perfil pessoal</button>
            </form>
          ) : null}
          {!hasBusiness ? (
            <form
              action={async () => {
                "use server";
                const current = await requireUser();
                const ws = await provisionWorkspace(current.id, "Empresa", "BUSINESS");
                await setActiveWorkspace(current.id, ws.id);
                redirect("/app");
              }}
            >
              <button className="btn btn-ghost">Criar perfil empresarial</button>
            </form>
          ) : null}
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
              <span className="text-muted whitespace-nowrap">
                {log.createdAt.toLocaleString("pt-BR")}
              </span>
            </li>
          ))}
          {!logs.length ? <li className="text-muted">Sem eventos ainda.</li> : null}
        </ul>
      </div>
    </div>
  );
}
