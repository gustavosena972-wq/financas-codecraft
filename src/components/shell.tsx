"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Sparkles, MessageCircle } from "lucide-react";
import { logoutAction, switchWorkspaceAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpFab } from "@/components/help-fab";
import { WelcomeGuide } from "@/components/welcome-guide";
import { ScreenTip } from "@/components/screen-tip";
import { AppNav } from "@/components/app-nav";
import { BrandLogo } from "@/components/brand-logo";
import { isCompanyPath, isPersonPath, type WorkspaceKind } from "@/lib/nav";

type Workspace = { id: string; name: string; type: WorkspaceKind };

export function AppShell({
  workspaces,
  activeId,
  children,
}: {
  userName?: string;
  workspaces: Workspace[];
  activeId: string;
  children: React.ReactNode;
}) {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/";
  const active = workspaces.find((w) => w.id === activeId);
  const kind: WorkspaceKind = active?.type === "BUSINESS" ? "BUSINESS" : "PERSONAL";
  const blockedCompany = isCompanyPath(pathname) && kind !== "BUSINESS";
  const blockedPerson = isPersonPath(pathname) && kind !== "PERSONAL";
  const studio = pathname === "/app/chat";
  const person = workspaces.find((w) => w.type === "PERSONAL");
  const company = workspaces.find((w) => w.type === "BUSINESS");

  return (
    <div className="min-h-screen">
      <header className="h-14 border-b border-line bg-paper/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between gap-3 app-top">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo href="/app" />
          <div className="flex rounded-lg border border-line overflow-hidden">
            {person ? (
              <form action={switchWorkspaceAction}>
                <input type="hidden" name="workspaceId" value={person.id} />
                <button
                  type="submit"
                  className={`px-3 py-1.5 text-sm ${
                    person.id === activeId ? "bg-ink text-white" : "bg-paper text-muted hover:bg-bg-2"
                  }`}
                >
                  Pessoa
                </button>
              </form>
            ) : null}
            {company ? (
              <form action={switchWorkspaceAction}>
                <input type="hidden" name="workspaceId" value={company.id} />
                <button
                  type="submit"
                  className={`px-3 py-1.5 text-sm ${
                    company.id === activeId ? "bg-ink text-white" : "bg-paper text-muted hover:bg-bg-2"
                  }`}
                >
                  Empresa
                </button>
              </form>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/chat" className="btn btn-ghost hidden sm:inline-flex">
            <MessageCircle size={15} />
            IA
          </Link>
          <Link href="/app/planos" className="btn btn-primary hidden sm:inline-flex">
            <Sparkles size={15} />
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
      <div className={`app-frame ${studio ? "studio" : ""}`}>
        <AppNav kind={kind} />
        <div className="app-body min-w-0">
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
        </div>
      </div>
      {studio ? null : <HelpFab />}
      {studio ? null : <WelcomeGuide />}
    </div>
  );
}
