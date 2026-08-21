"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CalendarDays,
  CircleHelp,
  FileSpreadsheet,
  Flag,
  LayoutDashboard,
  ListChecks,
  LogOut,
  MessageCircle,
  PiggyBank,
  Receipt,
  Scale,
  Settings,
  Shield,
  Sparkles,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { logoutAction, switchWorkspaceAction } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { HelpFab } from "@/components/help-fab";
import { WelcomeGuide } from "@/components/welcome-guide";
import { ScreenTip } from "@/components/screen-tip";

type Workspace = { id: string; name: string; type: "PERSONAL" | "BUSINESS" };

const GROUPS: { label: string; items: { href: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: "Operação",
    items: [
      { href: "/app", label: "Visão geral", icon: LayoutDashboard },
      { href: "/app/comecar", label: "Como usar", icon: CircleHelp },
      { href: "/app/lancamentos", label: "Lançamentos", icon: Receipt },
      { href: "/app/titulos", label: "Títulos", icon: ListChecks },
      { href: "/app/contas", label: "Contas", icon: Wallet },
      { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
    ],
  },
  {
    label: "Análise",
    items: [
      { href: "/app/dre", label: "DRE", icon: Scale },
      { href: "/app/orcamento", label: "Orçamento", icon: PiggyBank },
      { href: "/app/fluxo", label: "Fluxo de caixa", icon: ArrowLeftRight },
      { href: "/app/conciliacao", label: "Conciliação", icon: BookOpen },
    ],
  },
  {
    label: "Empresa",
    items: [
      { href: "/app/centros", label: "Centros e parceiros", icon: Building2 },
      { href: "/app/metas", label: "Metas", icon: Flag },
      { href: "/app/importar", label: "Planilha", icon: Upload },
      { href: "/app/exportar", label: "Exportar", icon: FileSpreadsheet },
      { href: "/app/auditoria", label: "Auditoria", icon: Shield },
      { href: "/app/equipe", label: "Equipe", icon: Users },
      { href: "/app/planos", label: "Planos", icon: Sparkles },
      { href: "/app/configuracoes", label: "Configurações", icon: Settings },
      { href: "/app/ajuda", label: "Ajuda", icon: MessageCircle },
    ],
  },
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
    <div className="min-h-screen grid lg:grid-cols-[248px_1fr] bg-bg">
      <aside className="bg-panel text-[#e8edf2] px-3 py-5 flex flex-col">
        <div className="flex items-center gap-2 px-2 mb-6">
          <span className="mark">FC</span>
          <div>
            <div className="font-semibold tracking-tight text-sm">Finanças CodeCraft</div>
            <div className="text-[11px] text-[#9aabba]">
              {active?.type === "BUSINESS" ? "Empresa" : "Pessoal"}
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto pr-1">
          {GROUPS.map((group) => (
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
                      className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] ${
                        on ? "bg-panel-2 text-white" : "text-[#b7c4cf] hover:bg-panel-2/70"
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
        <ScreenTip />
        <main className="p-6 lg:p-8 max-w-6xl">{children}</main>
        <HelpFab />
        <WelcomeGuide />
      </div>
    </div>
  );
}
