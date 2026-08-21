"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction, switchWorkspaceAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpFab } from "@/components/help-fab";
import { WelcomeGuide } from "@/components/welcome-guide";
import { ScreenTip } from "@/components/screen-tip";
import { isCompanyPath, isPersonPath, navFor, type WorkspaceKind } from "@/lib/nav";

type Workspace = { id: string; name: string; type: WorkspaceKind };

export function AppShell({
  userName,
  workspaces,
  activeId,
  children,
}: {
  userName: string;
  workspaces: Workspace[];
  activeId: string;
  children: React.ReactNode;
}) {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/";
  const active = workspaces.find((w) => w.id === activeId);
  const kind: WorkspaceKind = active?.type === "BUSINESS" ? "BUSINESS" : "PERSONAL";
  const groups = navFor(kind);
  const blockedCompany = isCompanyPath(pathname) && kind !== "BUSINESS";
  const blockedPerson = isPersonPath(pathname) && kind !== "PERSONAL";

  return (
    <div className="min-h-screen grid lg:grid-cols-[248px_1fr] bg-bg">
      <aside className="bg-panel text-[#e8edf2] px-3 py-5 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-6">
          <span className="mark">FC</span>
          <div>
            <div className="font-semibold tracking-tight text-sm">Finanças CodeCraft</div>
            <div className="text-[11px] text-[#9aabba]">{kind === "BUSINESS" ? "Empresa" : "Pessoal"}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="nav-label">{group.label}</div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const on = item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`nav-link flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] ${
                        on ? "on bg-panel-2 text-white" : "text-[#b7c4cf] hover:bg-panel-2/70"
                      }`}
                    >
                      <Icon size={15} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-[#b7c4cf] hover:bg-panel-2/70">
            <LogOut size={15} />
            Sair
          </button>
        </form>
      </aside>

      <div className="min-w-0">
        <header className="h-14 border-b border-line bg-paper/90 backdrop-blur px-6 flex items-center justify-between gap-4">
          <div className="text-sm text-muted flex items-center gap-3">
            <span>Olá, {userName.split(" ")[0]}</span>
            <span className="live-dot" title="Os números atualizam sozinhos">
              <span className="d" /> ao vivo
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/app/comecar" className="btn btn-ghost hidden sm:inline-flex">
              Como usar
            </Link>
            <ThemeToggle />
            <form action={switchWorkspaceAction}>
              <select
                name="workspaceId"
                defaultValue={activeId}
                onChange={(e) => e.currentTarget.form?.requestSubmit()}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                {workspaces.map((ws) => (
                  <option key={ws.id} value={ws.id}>
                    {ws.type === "BUSINESS" ? "Empresa" : "Pessoal"} — {ws.name}
                  </option>
                ))}
              </select>
            </form>
          </div>
        </header>
        {pathname === "/app" ? null : <ScreenTip mode={kind} />}
        <main className={pathname === "/app" ? "studio-main" : "p-6 lg:p-8 max-w-6xl"}>
          {blockedCompany ? (
            <div className="card p-8 max-w-lg space-y-3">
              <p className="page-kicker">Espaço pessoal</p>
              <h1 className="text-xl font-semibold">Isso aqui é da empresa</h1>
              <p className="text-sm text-muted">
                No pessoal você só vê gastos, contas e o que cortar. DRE, títulos e conciliação ficam no espaço
                Empresa. Troque no seletor do topo.
              </p>
            </div>
          ) : blockedPerson ? (
            <div className="card p-8 max-w-lg space-y-3">
              <p className="page-kicker">Espaço empresa</p>
              <h1 className="text-xl font-semibold">Isso aqui é da pessoa</h1>
              <p className="text-sm text-muted">
                Meta de caixa é do espaço Pessoal. Troque no seletor do topo. Aqui a empresa usa títulos e DRE.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
        {pathname !== "/app" ? <HelpFab /> : null}
        <WelcomeGuide />
      </div>
    </div>
  );
}
