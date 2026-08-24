"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
} from "lucide-react";

const ITEMS = [
  { href: "/app", label: "Painel", short: "Painel", icon: LayoutDashboard },
  { href: "/app/empresa", label: "Empresa", short: "Empresa", icon: Building2 },
  { href: "/app/financeiro", label: "Financeiro", short: "Caixa", icon: Wallet },
  { href: "/app/pessoas", label: "Pessoas", short: "RH", icon: Users },
  { href: "/app/planos", label: "Assinatura", short: "Plano", icon: CreditCard },
  { href: "/app/ajustes", label: "Ajustes", short: "Mais", icon: Settings },
];

export function AppNav() {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/app";
  return (
    <>
      <aside className="app-side">
        <p className="px-3 mb-2 kicker">Módulos</p>
        <nav className="space-y-1">
          {ITEMS.map((item) => {
            const on =
              item.href === "/app"
                ? pathname === "/app"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
      <nav className="app-side-mobile" aria-label="Navegação">
        {ITEMS.map((item) => {
          const on =
            item.href === "/app"
              ? pathname === "/app"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={`nav-tab ${on ? "on" : ""}`}>
              <Icon size={18} />
              <span>{item.short}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
