"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  CalendarDays,
  Flag,
  LayoutDashboard,
  LogOut,
  PiggyBank,
  Receipt,
  Settings,
  Sparkles,
  Upload,
  Wallet,
  Download,
} from "lucide-react";
import { logoutAction, switchWorkspaceAction } from "@/app/actions/auth";

type Workspace = { id: string; name: string; type: "PERSONAL" | "BUSINESS" };

const NAV = [
  { href: "/app", label: "Visão geral", icon: LayoutDashboard },
  { href: "/app/lancamentos", label: "Lançamentos", icon: Receipt },
  { href: "/app/contas", label: "Contas", icon: Wallet },
  { href: "/app/orcamento", label: "Orçamento", icon: PiggyBank },
  { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/app/metas", label: "Metas", icon: Flag },
  { href: "/app/fluxo", label: "Fluxo de caixa", icon: ArrowLeftRight },
  { href: "/app/importar", label: "Planilha", icon: Upload },
  { href: "/app/exportar", label: "Exportar", icon: Download },
  { href: "/app/planos", label: "Planos", icon: Sparkles },
  { href: "/app/configuracoes", label: "Configurações", icon: Settings },
];

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

  return (
    <div className="min-h-screen grid lg:grid-cols-[260px_1fr] bg-bg">
      <aside className="bg-panel text-[#e8edf2] px-4 py-5 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-8">
          <span className="mark">FC</span>
          <div>
            <div className="font-semibold tracking-tight">Finanças CodeCraft</div>
            <div className="text-[11px] text-[#9aabba]">
              {active?.type === "BUSINESS" ? "Empresa" : "Pessoal"}
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {NAV.map((item) => {
            const Icon = item.icon;
            const on =
              item.href === "/app"
                ? pathname === "/app"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ${
                  on ? "bg-panel-2 text-white" : "text-[#b7c4cf] hover:bg-panel-2/70"
                }`}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <form action={logoutAction}>
          <button className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-[#b7c4cf] hover:bg-panel-2/70">
            <LogOut size={16} />
            Sair
          </button>
        </form>
      </aside>

      <div className="min-w-0">
        <header className="h-16 border-b border-line bg-paper/80 backdrop-blur px-6 flex items-center justify-between gap-4">
          <div className="text-sm text-muted">Olá, {userName.split(" ")[0]}</div>
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
        </header>
        <main className="p-6 lg:p-8 max-w-6xl">{children}</main>
      </div>
    </div>
  );
}
