import type { LucideIcon } from "lucide-react";
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
  const home: NavGroup = {
    label: "Visão",
    items: [
      { href: "/app", label: "Patrimônio", icon: LayoutDashboard },
      { href: "/app/chat", label: "IA", icon: MessageCircle },
      { href: "/app/planos", label: "Planos", icon: Sparkles },
    ],
  };

  if (type === "BUSINESS") {
    return [
      home,
      {
        label: "Caixa",
        items: [
          { href: "/app/lancamentos", label: "Lançamentos", icon: Receipt },
          { href: "/app/titulos", label: "A pagar e receber", icon: ListChecks },
          { href: "/app/contas", label: "Contas", icon: Wallet },
          { href: "/app/agenda", label: "Agenda", icon: CalendarDays },
          { href: "/app/orcamento", label: "Orçamento", icon: PiggyBank },
        ],
      },
      {
        label: "Análise",
        items: [
          { href: "/app/dre", label: "DRE", icon: Scale },
          { href: "/app/fluxo", label: "Fluxo", icon: ArrowLeftRight },
          { href: "/app/investimentos", label: "Investimentos", icon: LineChart },
          { href: "/app/conciliacao", label: "Conciliação", icon: BookOpen },
        ],
      },
      {
        label: "Empresa",
        items: [
          { href: "/app/centros", label: "Centros", icon: Building2 },
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
    home,
    {
      label: "Dinheiro",
      items: [
        { href: "/app/lancamentos", label: "Lançamentos", icon: Receipt },
        { href: "/app/orcamento", label: "Orçamento", icon: PiggyBank },
        { href: "/app/contas", label: "Contas", icon: Wallet },
        { href: "/app/agenda", label: "Faturas", icon: CalendarDays },
      ],
    },
    {
      label: "Planejar",
      items: [
        { href: "/app/metas", label: "Metas", icon: Flag },
        { href: "/app/investimentos", label: "Investimentos", icon: LineChart },
        { href: "/app/dividas", label: "Dívidas", icon: CreditCard },
        { href: "/app/importar", label: "Importar", icon: Upload },
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
