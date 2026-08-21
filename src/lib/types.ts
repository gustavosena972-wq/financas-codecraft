export type WorkspaceType = "PERSONAL" | "BUSINESS";
export type AccountType = "CHECKING" | "SAVINGS" | "WALLET" | "CASH" | "CREDIT";
export type TransactionType = "INCOME" | "EXPENSE" | "TRANSFER";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  lastWorkspaceId: string | null;
  createdAt: string;
  plan: "FREE" | "PRO" | "BUSINESS" | "ENTERPRISE";
};

export type Workspace = {
  id: string;
  name: string;
  type: WorkspaceType;
  ownerId: string;
  createdAt: string;
};

export type Account = {
  id: string;
  workspaceId: string;
  name: string;
  type: AccountType;
  initialBalance: number;
  archived: boolean;
  createdAt: string;
};

export type Category = {
  id: string;
  workspaceId: string;
  name: string;
  kind: string;
  color: string;
};

export type Transaction = {
  id: string;
  workspaceId: string;
  accountId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  date: string;
  description: string;
  notes?: string;
  transferToAccountId: string | null;
  importHash: string | null;
  createdAt: string;
};

export type Budget = {
  id: string;
  workspaceId: string;
  categoryId: string;
  month: string;
  amount: number;
};

export type Recurring = {
  id: string;
  workspaceId: string;
  description: string;
  amount: number;
  type: "INCOME" | "EXPENSE";
  categoryId: string | null;
  accountId: string;
  day: number;
};

export type Goal = {
  id: string;
  workspaceId: string;
  name: string;
  target: number;
  deadline: string;
};

export type WorkspaceExtras = {
  recurring: Recurring[];
  goals: Goal[];
};

export type AuditLog = {
  id: string;
  workspaceId?: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: string;
  createdAt: string;
};

export type DB = {
  users: User[];
  workspaces: Workspace[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  extras: Record<string, WorkspaceExtras>;
  auditLogs: AuditLog[];
};

export function newId() {
  return crypto.randomUUID();
}

export function nowIso() {
  return new Date().toISOString();
}

export function go(path: string) {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  const raw = path.startsWith("/") ? path : `/${path}`;
  const [pathname, search] = raw.split("?");
  const slashed = pathname.endsWith("/") ? pathname : `${pathname}/`;
  window.location.href = `${base}${slashed}${search ? `?${search}` : ""}`;
}
