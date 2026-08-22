"use client";

import Link from "next/link";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CalendarDays,
  CreditCard,
  Flag,
  LayoutDashboard,
  LineChart,
  ListChecks,
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
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { guideForMode } from "@/lib/guide";
import type { WorkspaceKind } from "@/lib/nav";

const ICONS: Record<string, LucideIcon> = {
  "/app": LayoutDashboard,
  "/app/chat": MessageCircle,
  "/app/lancamentos": Receipt,
  "/app/contas": Wallet,
  "/app/agenda": CalendarDays,
  "/app/orcamento": PiggyBank,
  "/app/investimentos": LineChart,
  "/app/dividas": CreditCard,
  "/app/ferramentas": Wrench,
  "/app/educacao": BookOpen,
  "/app/importar": Upload,
  "/app/titulos": ListChecks,
  "/app/dre": Scale,
  "/app/fluxo": ArrowLeftRight,
  "/app/conciliacao": BookOpen,
  "/app/centros": Building2,
  "/app/auditoria": Shield,
  "/app/equipe": Users,
  "/app/planos": Sparkles,
  "/app/configuracoes": Settings,
  "/app/metas": Flag,
};

export function ToolTiles({
  mode,
  limit,
}: {
  mode: WorkspaceKind;
  limit?: number;
}) {
  const items = guideForMode(mode).filter((item) => item.href !== "/app/ajuda" && item.href !== "/app/comecar");
  const shown = limit ? items.slice(0, limit) : items;

  return (
    <div className="tool-tiles">
      {shown.map((item, i) => {
        const Icon = ICONS[item.href] ?? Wrench;
        return (
          <Link key={item.href} href={item.href} className="tool-tile" style={{ animationDelay: `${i * 0.04}s` }}>
            <span className="tool-tile-icon">
              <Icon size={16} />
            </span>
            <strong>{item.title}</strong>
            <p>{item.does}</p>
          </Link>
        );
      })}
    </div>
  );
}
