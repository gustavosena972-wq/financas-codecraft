import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpen,
  Building2,
  CalendarDays,
  Flag,
  GraduationCap,
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
        label: "Dia a dia",
        items: [
          { href: "/app", label: "Chat", icon: MessageCircle },
          { href: "/app/ferramentas", label: "Ferramentas", icon: Wrench },
          { href: "/app/educacao", label: "Educação", icon: GraduationCap },
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
          { href: "/app/fluxo", label: "Fluxo de caixa", icon: ArrowLeftRight },
          { href: "/app/orcamento", label: "Orçamento", icon: PiggyBank },
          { href: "/app/conciliacao", label: "Conciliação", icon: BookOpen },
        ],
      },
      {
        label: "Empresa",
        items: [
          { href: "/app/centros", label: "Centros e parceiros", icon: Building2 },
          { href: "/app/importar", label: "Planilha", icon: Upload },
          { href: "/app/auditoria", label: "Auditoria", icon: Shield },
          { href: "/app/equipe", label: "Equipe", icon: Users },
        ],
      },
      {
        label: "Conta",
        items: [
          { href: "/app/planos", label: "Planos", icon: Sparkles },
          { href: "/app/configuracoes", label: "Configurações", icon: Settings },
          { href: "/app/ajuda", label: "Ajuda", icon: MessageCircle },
        ],
      },
    ];
  }

  return [
    {
      label: "Seu dinheiro",
      items: [
        { href: "/app", label: "Chat", icon: MessageCircle },
        { href: "/app/ferramentas", label: "Ferramentas", icon: Wrench },
        { href: "/app/educacao", label: "Educação", icon: GraduationCap },
        { href: "/app/importar", label: "Mandar planilha", icon: Upload },
        { href: "/app/lancamentos", label: "Lançar na mão", icon: Receipt },
        { href: "/app/contas", label: "Contas", icon: Wallet },
        { href: "/app/agenda", label: "Contas do mês", icon: CalendarDays },
      ],
    },
    {
      label: "Controle",
      items: [
        { href: "/app/orcamento", label: "Teto do mês", icon: PiggyBank },
        { href: "/app/metas", label: "Metas", icon: Flag },
      ],
    },
    {
      label: "Conta",
      items: [
        { href: "/app/planos", label: "Planos", icon: Sparkles },
        { href: "/app/configuracoes", label: "Configurações", icon: Settings },
        { href: "/app/ajuda", label: "Ajuda", icon: MessageCircle },
      ],
    },
  ];
}
