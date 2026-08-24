export type PlanId = "FREE" | "TEAM" | "BUSINESS" | "ENTERPRISE";
export type OrgSize = "mei" | "pequena" | "media" | "grande";
export type Department =
  | "DIRECAO"
  | "PESSOAS"
  | "VENDAS"
  | "OPS"
  | "CAIXA"
  | "ESTOQUE"
  | "MARKETING"
  | "SUPORTE";

export type Profile = {
  id: string;
  name: string;
  email: string;
  lastOrgId: string | null;
  plan: PlanId;
  createdAt: string;
};

export type Org = {
  id: string;
  ownerId: string;
  name: string;
  size: OrgSize;
  autopilot: boolean;
  createdAt: string;
  legalName: string;
  tradeName: string;
  cnpj: string;
  ie: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  activity: string;
  legalRep: string;
  situation: string;
  linkedAt: string | null;
};

export type Person = {
  id: string;
  orgId: string;
  name: string;
  email: string;
  department: Department;
  role: "ADMIN" | "LEAD" | "MEMBER";
  status: "ACTIVE" | "ONBOARDING" | "LEAVE";
  salary: number;
  startedAt: string;
};

export type Deal = {
  id: string;
  orgId: string;
  name: string;
  customer: string;
  amount: number;
  stage: "LEAD" | "PROPOSAL" | "WON" | "LOST";
  ownerName: string;
  dueAt: string;
  createdAt: string;
};

export type Work = {
  id: string;
  orgId: string;
  name: string;
  ownerName: string;
  status: "PLAN" | "RUN" | "BLOCKED" | "DONE";
  dueAt: string;
  notes: string;
};

export type Task = {
  id: string;
  orgId: string;
  title: string;
  area: string;
  status: "TODO" | "DOING" | "DONE";
  assignee: string;
  auto: boolean;
  createdAt: string;
};

export type Wallet = {
  id: string;
  orgId: string;
  name: string;
  kind: "BANK" | "CASH" | "CARD";
  opening: number;
};

export type Move = {
  id: string;
  orgId: string;
  walletId: string;
  type: "IN" | "OUT";
  amount: number;
  date: string;
  description: string;
  category: string;
};

export type Bill = {
  id: string;
  orgId: string;
  kind: "PAY" | "GET";
  party: string;
  description: string;
  amount: number;
  due: string;
  status: "OPEN" | "PAID";
};

export type StockItem = {
  id: string;
  orgId: string;
  name: string;
  qty: number;
  minQty: number;
  unitCost: number;
};

export type AiLog = {
  id: string;
  orgId: string;
  kind: "done" | "ask" | "watch";
  title: string;
  body: string;
  createdAt: string;
};

export const DEPARTMENTS: { id: Department; name: string; does: string }[] = [
  { id: "DIRECAO", name: "Direção", does: "O pulso da empresa, numa tela." },
  { id: "PESSOAS", name: "Pessoas", does: "Quem trabalha, cargo e status." },
  { id: "VENDAS", name: "Vendas", does: "Pipeline: lead, proposta, ganho." },
  { id: "OPS", name: "Projetos", does: "O que está andando e o que travou." },
  { id: "CAIXA", name: "Caixa", does: "Dinheiro, a pagar e a receber." },
  { id: "ESTOQUE", name: "Estoque", does: "O que tem, o que falta." },
  { id: "MARKETING", name: "Marketing", does: "Campanha e captação." },
  { id: "SUPORTE", name: "Atendimento", does: "Cliente depois da venda." },
];

export function newId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function today() {
  return nowIso().slice(0, 10);
}

export function go(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const raw = path.startsWith("/") ? path : `/${path}`;
  const [pathname, search] = raw.split("?");
  const slashed = pathname.endsWith("/") ? pathname : `${pathname}/`;
  window.location.href = `${base}${slashed}${search ? `?${search}` : ""}`;
}
