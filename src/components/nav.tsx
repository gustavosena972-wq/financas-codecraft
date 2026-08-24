"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  Building2,
  LayoutDashboard,
  MessageCircle,
  Settings,
  Sparkles,
  Users,
  Wallet,
  Workflow,
  Handshake,
} from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Painel", icon: LayoutDashboard },
  { href: "/app/empresa", label: "Empresa", icon: Building2 },
  { href: "/app/ia", label: "IA", icon: MessageCircle },
  { href: "/app/pessoas", label: "Pessoas", icon: Users },
  { href: "/app/vendas", label: "Vendas", icon: Handshake },
  { href: "/app/projetos", label: "Projetos", icon: Workflow },
  { href: "/app/caixa", label: "Caixa", icon: Wallet },
  { href: "/app/estoque", label: "Estoque", icon: Boxes },
  { href: "/app/planos", label: "Planos", icon: Sparkles },
  { href: "/app/ajustes", label: "Ajustes", icon: Settings },
];

export function AppNav() {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/app";
  return (
    <>
      <aside className="app-side">
        <p className="px-3 mb-2 kicker">Setores</p>
        <nav className="space-y-1">
          {ITEMS.map((item) => {
            const on = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`nav-link ${on ? "on" : ""}`}>
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="app-side-mobile">
        {ITEMS.map((item) => {
          const on = item.href === "/app" ? pathname === "/app" : pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className={`chip ${on ? "ok" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
