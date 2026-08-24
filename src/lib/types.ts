export type PlanId = "NONE" | "START" | "BUSINESS" | "CORP";
export type BillingStatus = "inactive" | "active" | "past_due";
export type OrgSize = "mei" | "pequena" | "media" | "grande";
export type Department =
  | "DIRECAO"
  | "FINANCEIRO"
  | "PESSOAS"
  | "OPERACOES"
  | "COMERCIAL"
  | "SUPORTE";

export type Profile = {
  id: string;
  name: string;
  email: string;
  lastOrgId: string | null;
  plan: PlanId;
  billingStatus: BillingStatus;
  billingMethod: "" | "card" | "pix";
  cardLast4: string;
  cardBrand: string;
  cardExp: string;
  cardHolder: string;
  cardCpf: string;
  creditCents: number;
  nextChargeAt: string | null;
  billedAt: string | null;
  createdAt: string;
};

export type Org = {
  id: string;
  ownerId: string;
  name: string;
  size: OrgSize;
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
  document: string;
  department: Department;
  roleTitle: string;
  role: "ADMIN" | "LEAD" | "MEMBER";
  status: "ACTIVE" | "ONBOARDING" | "LEAVE";
  salary: number;
  benefits: string;
  startedAt: string;
};

export type TimePunch = {
  id: string;
  orgId: string;
  personId: string;
  kind: "IN" | "OUT" | "BREAK_START" | "BREAK_END";
  at: string;
  note: string;
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
  costCenter: string;
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

export const DEPARTMENTS: { id: Department; name: string; does: string }[] = [
  { id: "DIRECAO", name: "Direção", does: "Visão da empresa e decisões." },
  { id: "FINANCEIRO", name: "Financeiro", does: "Caixa, títulos e DRE." },
  { id: "PESSOAS", name: "Pessoas", does: "Colaboradores, ponto e folha." },
  { id: "OPERACOES", name: "Operações", does: "Rotina e entrega do dia a dia." },
  { id: "COMERCIAL", name: "Comercial", does: "Clientes e receita." },
  { id: "SUPORTE", name: "Suporte", does: "Atendimento interno." },
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
