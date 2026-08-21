import type { Account, AuditLog, Budget, Category, Goal, Recurring, Transaction, User, Workspace, WorkspaceExtras } from "./types";
import { newId, nowIso } from "./types";
import { getSupabase } from "./supabase";

const WS_KEY = "ccs-financas-ws";

type Snapshot = {
  user: User;
  workspaces: Workspace[];
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  extras: Record<string, WorkspaceExtras>;
  auditLogs: AuditLog[];
};

let snapshot: Snapshot | null = null;
let loading: Promise<Snapshot | null> | null = null;

export function getSessionWorkspaceId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WS_KEY);
}

export function setSessionWorkspaceId(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(WS_KEY, id);
  else localStorage.removeItem(WS_KEY);
}

function parsePlan(value: unknown): User["plan"] {
  if (value === "PRO" || value === "BUSINESS" || value === "ENTERPRISE") return value;
  return "FREE";
}

function parseExtras(raw: unknown): Record<string, WorkspaceExtras> {
  let value = raw;
  if (typeof value === "string") {
    try {
      value = JSON.parse(value);
    } catch {
      return {};
    }
  }
  if (!value || typeof value !== "object") return {};
  const out: Record<string, WorkspaceExtras> = {};
  for (const [key, item] of Object.entries(value as Record<string, WorkspaceExtras>)) {
    out[key] = {
      recurring: Array.isArray(item?.recurring) ? item.recurring : [],
      goals: Array.isArray(item?.goals) ? item.goals : [],
    };
  }
  return out;
}

function emptyExtras(): WorkspaceExtras {
  return { recurring: [], goals: [] };
}

function mapUser(
  id: string,
  email: string,
  name: string,
  lastWorkspaceId: string | null,
  createdAt: string,
  plan: User["plan"] = "FREE",
): User {
  return { id, email, name, lastWorkspaceId, createdAt, passwordHash: "", plan };
}

function mapWorkspace(row: Record<string, unknown>): Workspace {
  return {
    id: String(row.id),
    name: String(row.name),
    type: row.type as Workspace["type"],
    ownerId: String(row.owner_id),
    createdAt: String(row.created_at),
  };
}

function mapAccount(row: Record<string, unknown>): Account {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    name: String(row.name),
    type: row.type as Account["type"],
    initialBalance: Number(row.initial_balance ?? 0),
    archived: Boolean(row.archived),
    createdAt: String(row.created_at),
  };
}

function mapCategory(row: Record<string, unknown>): Category {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    name: String(row.name),
    kind: String(row.kind),
    color: String(row.color),
  };
}

function mapTx(row: Record<string, unknown>): Transaction {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    accountId: String(row.account_id),
    categoryId: row.category_id ? String(row.category_id) : null,
    type: row.type as Transaction["type"],
    amount: Number(row.amount),
    date: String(row.date),
    description: String(row.description),
    notes: row.notes ? String(row.notes) : undefined,
    transferToAccountId: row.transfer_to_account_id ? String(row.transfer_to_account_id) : null,
    importHash: row.import_hash ? String(row.import_hash) : null,
    createdAt: String(row.created_at),
  };
}

function mapBudget(row: Record<string, unknown>): Budget {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    categoryId: String(row.category_id),
    month: String(row.month),
    amount: Number(row.amount),
  };
}

function mapLog(row: Record<string, unknown>): AuditLog {
  return {
    id: String(row.id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : undefined,
    userId: String(row.user_id),
    action: String(row.action),
    entity: String(row.entity),
    entityId: row.entity_id ? String(row.entity_id) : undefined,
    detail: row.detail ? String(row.detail) : undefined,
    createdAt: String(row.created_at),
  };
}

export async function refreshSession() {
  if (loading) return loading;
  loading = loadSnapshot();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

async function loadSnapshot() {
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    snapshot = null;
    return null;
  }
  const authUser = authData.user;
  const [{ data: profile }, { data: workspaces }, { data: logs }] = await Promise.all([
    supabase.from("fc_profiles").select("*").eq("id", authUser.id).maybeSingle(),
    supabase.from("fc_workspaces").select("*").eq("owner_id", authUser.id).order("created_at"),
    supabase.from("fc_audit_logs").select("*").eq("user_id", authUser.id).order("created_at", { ascending: false }).limit(12),
  ]);
  const wsRows = workspaces ?? [];
  const workspaceIds = wsRows.map((w) => w.id as string);
  let accounts: Account[] = [];
  let categories: Category[] = [];
  let transactions: Transaction[] = [];
  let budgets: Budget[] = [];
  if (workspaceIds.length) {
    const [acc, cat, tx, bud] = await Promise.all([
      supabase.from("fc_accounts").select("*").in("workspace_id", workspaceIds),
      supabase.from("fc_categories").select("*").in("workspace_id", workspaceIds),
      supabase.from("fc_transactions").select("*").in("workspace_id", workspaceIds),
      supabase.from("fc_budgets").select("*").in("workspace_id", workspaceIds),
    ]);
    accounts = (acc.data ?? []).map((row) => mapAccount(row as Record<string, unknown>));
    categories = (cat.data ?? []).map((row) => mapCategory(row as Record<string, unknown>));
    transactions = (tx.data ?? []).map((row) => mapTx(row as Record<string, unknown>));
    budgets = (bud.data ?? []).map((row) => mapBudget(row as Record<string, unknown>));
  }
  snapshot = {
    user: mapUser(
      authUser.id,
      authUser.email ?? "",
      (profile?.name as string) || (authUser.user_metadata?.name as string) || "Usuário",
      (profile?.last_workspace_id as string) ?? null,
      authUser.created_at,
      parsePlan(authUser.user_metadata?.plan),
    ),
    workspaces: wsRows.map((row) => mapWorkspace(row as Record<string, unknown>)),
    accounts,
    categories,
    transactions,
    budgets,
    extras: parseExtras(authUser.user_metadata?.extras),
    auditLogs: (logs ?? []).map((row) => mapLog(row as Record<string, unknown>)),
  };
  return snapshot;
}

export function currentUser(): User | null {
  return snapshot?.user ?? null;
}

export function currentWorkspace(): Workspace | null {
  if (!snapshot) return null;
  const preferred = getSessionWorkspaceId() || snapshot.user.lastWorkspaceId;
  return snapshot.workspaces.find((w) => w.id === preferred) ?? snapshot.workspaces[0] ?? null;
}

export async function requireSession() {
  if (!snapshot) await refreshSession();
  const user = currentUser();
  const workspace = currentWorkspace();
  if (!user || !workspace || !snapshot) return null;
  return { user, workspace, db: snapshot };
}

export function listAccounts(workspaceId: string, includeArchived = false) {
  return (snapshot?.accounts ?? [])
    .filter((a) => a.workspaceId === workspaceId && (includeArchived || !a.archived))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listCategories(workspaceId: string) {
  return (snapshot?.categories ?? [])
    .filter((c) => c.workspaceId === workspaceId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listTransactions(workspaceId: string) {
  return (snapshot?.transactions ?? []).filter((t) => t.workspaceId === workspaceId);
}

export function listBudgets(workspaceId: string, month: string) {
  return (snapshot?.budgets ?? []).filter((b) => b.workspaceId === workspaceId && b.month === month);
}

export function listRecurring(workspaceId: string) {
  return snapshot?.extras[workspaceId]?.recurring ?? [];
}

export function listGoals(workspaceId: string) {
  return snapshot?.extras[workspaceId]?.goals ?? [];
}

async function persistExtras() {
  if (!snapshot) return;
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({
    data: { plan: snapshot.user.plan, extras: snapshot.extras },
  });
  if (error) throw error;
}

export async function saveRecurring(workspaceId: string, items: Recurring[]) {
  if (!snapshot) throw new Error("Sessão expirada.");
  snapshot.extras[workspaceId] = { ...(snapshot.extras[workspaceId] ?? emptyExtras()), recurring: items };
  await persistExtras();
}

export async function saveGoals(workspaceId: string, items: Goal[]) {
  if (!snapshot) throw new Error("Sessão expirada.");
  snapshot.extras[workspaceId] = { ...(snapshot.extras[workspaceId] ?? emptyExtras()), goals: items };
  await persistExtras();
}

export function listWorkspaces(userId: string) {
  return (snapshot?.workspaces ?? [])
    .filter((w) => w.ownerId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listLogs(userId: string) {
  return (snapshot?.auditLogs ?? []).filter((l) => l.userId === userId).slice(0, 12);
}

export async function ensureProfile(userId: string, name: string) {
  const supabase = getSupabase();
  const { data } = await supabase.from("fc_profiles").select("id").eq("id", userId).maybeSingle();
  if (data) return;
  const { error } = await supabase.from("fc_profiles").insert({ id: userId, name });
  if (error) throw error;
}

export async function addWorkspace(ws: Workspace, accounts: Account[], categories: Category[]) {
  const supabase = getSupabase();
  const { error: wsError } = await supabase.from("fc_workspaces").insert({
    id: ws.id,
    owner_id: ws.ownerId,
    name: ws.name,
    type: ws.type,
    created_at: ws.createdAt,
  });
  if (wsError) throw wsError;
  if (accounts.length) {
    const { error } = await supabase.from("fc_accounts").insert(
      accounts.map((account) => ({
        id: account.id,
        workspace_id: account.workspaceId,
        name: account.name,
        type: account.type,
        initial_balance: account.initialBalance,
        archived: account.archived,
        created_at: account.createdAt,
      })),
    );
    if (error) throw error;
  }
  if (categories.length) {
    const { error } = await supabase.from("fc_categories").insert(
      categories.map((category) => ({
        id: category.id,
        workspace_id: category.workspaceId,
        name: category.name,
        kind: category.kind,
        color: category.color,
      })),
    );
    if (error) throw error;
  }
  if (snapshot && snapshot.user.id === ws.ownerId) {
    snapshot.workspaces.push(ws);
    snapshot.accounts.push(...accounts);
    snapshot.categories.push(...categories);
  }
}

export async function addAccount(account: Account) {
  const supabase = getSupabase();
  const { error } = await supabase.from("fc_accounts").insert({
    id: account.id,
    workspace_id: account.workspaceId,
    name: account.name,
    type: account.type,
    initial_balance: account.initialBalance,
    archived: account.archived,
    created_at: account.createdAt,
  });
  if (error) throw error;
  snapshot?.accounts.push(account);
}

export async function archiveAccount(id: string, workspaceId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("fc_accounts").update({ archived: true }).eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  const acc = snapshot?.accounts.find((a) => a.id === id && a.workspaceId === workspaceId);
  if (acc) acc.archived = true;
}

export async function addTransaction(tx: Transaction) {
  const supabase = getSupabase();
  const { error } = await supabase.from("fc_transactions").insert({
    id: tx.id,
    workspace_id: tx.workspaceId,
    account_id: tx.accountId,
    category_id: tx.categoryId,
    type: tx.type,
    amount: tx.amount,
    date: tx.date,
    description: tx.description,
    notes: tx.notes ?? null,
    transfer_to_account_id: tx.transferToAccountId,
    import_hash: tx.importHash,
    created_at: tx.createdAt,
  });
  if (error) throw error;
  snapshot?.transactions.push(tx);
}

export async function deleteTransaction(id: string, workspaceId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("fc_transactions").delete().eq("id", id).eq("workspace_id", workspaceId);
  if (error) throw error;
  if (snapshot) {
    snapshot.transactions = snapshot.transactions.filter((t) => !(t.id === id && t.workspaceId === workspaceId));
  }
}

export async function upsertBudget(row: Budget) {
  const supabase = getSupabase();
  const existing = snapshot?.budgets.find(
    (b) => b.workspaceId === row.workspaceId && b.categoryId === row.categoryId && b.month === row.month,
  );
  if (existing) {
    const { error } = await supabase.from("fc_budgets").update({ amount: row.amount }).eq("id", existing.id);
    if (error) throw error;
    existing.amount = row.amount;
    return;
  }
  const { error } = await supabase.from("fc_budgets").insert({
    id: row.id,
    workspace_id: row.workspaceId,
    category_id: row.categoryId,
    month: row.month,
    amount: row.amount,
  });
  if (error) throw error;
  snapshot?.budgets.push(row);
}

export async function pushAudit(userId: string, action: string, entity: string, extra?: Partial<AuditLog>) {
  const row: AuditLog = {
    id: newId(),
    userId,
    action,
    entity,
    createdAt: nowIso(),
    ...extra,
  };
  const supabase = getSupabase();
  const { error } = await supabase.from("fc_audit_logs").insert({
    id: row.id,
    workspace_id: row.workspaceId ?? null,
    user_id: row.userId,
    action: row.action,
    entity: row.entity,
    entity_id: row.entityId ?? null,
    detail: row.detail ?? null,
    created_at: row.createdAt,
  });
  if (error) throw error;
  snapshot?.auditLogs.unshift(row);
}

export async function setUserPlan(plan: User["plan"]) {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({ data: { plan, extras: snapshot?.extras ?? {} } });
  if (error) throw error;
  if (snapshot) snapshot.user.plan = plan;
}

export async function setLastWorkspace(userId: string, workspaceId: string) {
  const supabase = getSupabase();
  const { error } = await supabase.from("fc_profiles").update({ last_workspace_id: workspaceId }).eq("id", userId);
  if (error) throw error;
  if (snapshot?.user.id === userId) snapshot.user.lastWorkspaceId = workspaceId;
  setSessionWorkspaceId(workspaceId);
}

export async function logoutSession() {
  await getSupabase().auth.signOut();
  snapshot = null;
  setSessionWorkspaceId(null);
}
