"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction, switchWorkspaceAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpFab } from "@/components/help-fab";
import { WelcomeGuide } from "@/components/welcome-guide";
import { ScreenTip } from "@/components/screen-tip";
import { isCompanyPath, isPersonPath, type WorkspaceKind } from "@/lib/nav";

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
  const blockedCompany = isCompanyPath(pathname) && kind !== "BUSINESS";
  const blockedPerson = isPersonPath(pathname) && kind !== "PERSONAL";
  const studio = pathname === "/app";

  return (
    <div className="min-h-screen bg-bg">
      <header className="h-14 border-b border-line bg-paper/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="mark">FC</span>
          <div className="hidden sm:block min-w-0">
            <div className="font-semibold tracking-tight text-sm">Finanças CodeCraft</div>
            <div className="text-[11px] text-muted truncate">Olá, {userName.split(" ")[0]}</div>
          </div>
          <div className="flex rounded-lg border border-line overflow-hidden">
            {workspaces.map((ws) => (
              <form key={ws.id} action={switchWorkspaceAction}>
                <input type="hidden" name="workspaceId" value={ws.id} />
                <button
                  type="submit"
                  className={`px-3 py-1.5 text-sm ${
                    ws.id === activeId ? "bg-ink text-white" : "bg-paper text-muted hover:bg-bg-2"
                  }`}
                >
                  {ws.type === "BUSINESS" ? "Empresa" : "Pessoa"}
                </button>
              </form>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/planos" className="btn btn-ghost hidden sm:inline-flex">
            Planos
          </Link>
          <ThemeToggle />
          <form action={logoutAction}>
            <button className="btn btn-ghost" type="submit" title="Sair">
              <LogOut size={15} />
            </button>
          </form>
        </div>
      </header>
      {studio ? null : <ScreenTip mode={kind} />}
      <main className={studio ? "studio-main" : "p-6 lg:p-8 max-w-6xl"}>
        {blockedCompany ? (
          <div className="card p-8 max-w-lg space-y-3">
            <p className="page-kicker">Espaço pessoal</p>
            <h1 className="text-xl font-semibold">Isso aqui é da empresa</h1>
            <p className="text-sm text-muted">Troque para Empresa no topo. O dinheiro da pessoa não mistura com o caixa.</p>
          </div>
        ) : blockedPerson ? (
          <div className="card p-8 max-w-lg space-y-3">
            <p className="page-kicker">Espaço empresa</p>
            <h1 className="text-xl font-semibold">Isso aqui é da pessoa</h1>
            <p className="text-sm text-muted">Troque para Pessoa no topo. Aqui a empresa cuida do caixa.</p>
          </div>
        ) : (
          children
        )}
      </main>
      {studio ? null : <HelpFab />}
      {studio ? null : <WelcomeGuide />}
    </div>
  );
}
