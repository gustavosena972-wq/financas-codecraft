import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpen,
  CreditCard,
  LayoutDashboard,
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
} from "lucide-react";

export type WorkspaceKind = "PERSONAL" | "BUSINESS";

export type NavItem = { href: string; label: string; icon: LucideIcon };
export type NavGroup = { label: string; items: NavItem[] };

const COMPANY_HREFS = [
  "/app/titulos",
  "/app/dre",
  "/app/fluxo",
  "/app/conciliacao",
  "/app/centros",
  "/app/auditoria",
  "/app/equipe",
];

const PERSON_HREFS = ["/app/metas"];

export function isCompanyPath(pathname: string) {
  const clean = pathname.replace(/\/$/, "") || "/app";
  return COMPANY_HREFS.some((href) => clean === href || clean.startsWith(`${href}/`));
}

export function isPersonPath(pathname: string) {
  const clean = pathname.replace(/\/$/, "") || "/app";
  return PERSON_HREFS.some((href) => clean === href || clean.startsWith(`${href}/`));
}

export function navFor(type: WorkspaceKind): NavGroup[] {
  if (type === "BUSINESS") {
    return [
      {
        label: "Visão",
        items: [
          { href: "/app", label: "Caixa", icon: LayoutDashboard },
          { href: "/app/chat", label: "IA", icon: MessageCircle },
          { href: "/app/planos", label: "Planos", icon: Sparkles },
        ],
      },
      {
        label: "Caixa",
        items: [
          { href: "/app/lancamentos", label: "Lançamentos", icon: Receipt },
          { href: "/app/titulos", label: "A pagar e receber", icon: ListChecks },
          { href: "/app/contas", label: "Contas", icon: Wallet },
        ],
      },
      {
        label: "Análise",
        items: [
          { href: "/app/dre", label: "DRE", icon: Scale },
          { href: "/app/fluxo", label: "Fluxo", icon: ArrowLeftRight },
          { href: "/app/conciliacao", label: "Conciliação", icon: BookOpen },
        ],
      },
      {
        label: "Empresa",
        items: [
          { href: "/app/importar", label: "Importar", icon: Upload },
          { href: "/app/equipe", label: "Equipe", icon: Users },
          { href: "/app/auditoria", label: "Auditoria", icon: Shield },
        ],
      },
      {
        label: "Conta",
        items: [
          { href: "/app/configuracoes", label: "Ajustes", icon: Settings },
        ],
      },
    ];
  }

  return [
    {
      label: "A casa",
      items: [
        { href: "/app", label: "O que sobra", icon: LayoutDashboard },
        { href: "/app/orcamento", label: "Este mês", icon: PiggyBank },
        { href: "/app/dividas", label: "Cartões", icon: CreditCard },
        { href: "/app/importar", label: "Mandar planilha", icon: Upload },
        { href: "/app/chat", label: "IA", icon: MessageCircle },
      ],
    },
    {
      label: "Conta",
      items: [
        { href: "/app/lancamentos", label: "Lançar na mão", icon: Receipt },
        { href: "/app/contas", label: "Contas", icon: Wallet },
        { href: "/app/planos", label: "Planos", icon: Sparkles },
        { href: "/app/configuracoes", label: "Ajustes", icon: Settings },
      ],
    },
  ];
}
