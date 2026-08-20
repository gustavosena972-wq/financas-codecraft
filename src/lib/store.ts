import type { Account, AuditLog, Budget, Category, DB, Transaction, User, Workspace } from "./types";
import { newId, nowIso } from "./types";

const KEY = "ccs-financas-db-v1";
const USER_KEY = "ccs-financas-user";
const WS_KEY = "ccs-financas-ws";

const empty = (): DB => ({
  users: [],
  workspaces: [],
  accounts: [],
  categories: [],
  transactions: [],
  budgets: [],
  auditLogs: [],
});

export function loadDb(): DB {
  if (typeof window === "undefined") return empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    return { ...empty(), ...JSON.parse(raw) } as DB;
  } catch {
    return empty();
  }
}

export function saveDb(db: DB) {
  localStorage.setItem(KEY, JSON.stringify(db));
}

export function getSessionUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USER_KEY);
}

export function setSessionUserId(id: string | null) {
  if (id) localStorage.setItem(USER_KEY, id);
  else localStorage.removeItem(USER_KEY);
}

export function getSessionWorkspaceId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(WS_KEY);
}

export function setSessionWorkspaceId(id: string | null) {
  if (id) localStorage.setItem(WS_KEY, id);
  else localStorage.removeItem(WS_KEY);
}

export function currentUser(): User | null {
  const id = getSessionUserId();
  if (!id) return null;
  return loadDb().users.find((u) => u.id === id) ?? null;
}

export function currentWorkspace(): Workspace | null {
  const user = currentUser();
  if (!user) return null;
  const db = loadDb();
  const preferred = getSessionWorkspaceId() || user.lastWorkspaceId;
  const owned = db.workspaces.filter((w) => w.ownerId === user.id);
  return owned.find((w) => w.id === preferred) ?? owned[0] ?? null;
}

export function requireSession() {
  const user = currentUser();
  const workspace = currentWorkspace();
  if (!user || !workspace) return null;
  return { user, workspace, db: loadDb() };
}

export function pushAudit(db: DB, userId: string, action: string, entity: string, extra?: Partial<AuditLog>) {
  db.auditLogs.unshift({
    id: newId(),
    userId,
    action,
    entity,
    createdAt: nowIso(),
    ...extra,
  });
}

export function findUserByEmail(email: string) {
  return loadDb().users.find((u) => u.email === email.toLowerCase()) ?? null;
}

export function upsertUser(user: User) {
  const db = loadDb();
  const i = db.users.findIndex((u) => u.id === user.id);
  if (i >= 0) db.users[i] = user;
  else db.users.push(user);
  saveDb(db);
}

export function addWorkspace(ws: Workspace, accounts: Account[], categories: Category[]) {
  const db = loadDb();
  db.workspaces.push(ws);
  db.accounts.push(...accounts);
  db.categories.push(...categories);
  saveDb(db);
}

export function addAccount(account: Account) {
  const db = loadDb();
  db.accounts.push(account);
  saveDb(db);
}

export function archiveAccount(id: string, workspaceId: string) {
  const db = loadDb();
  const acc = db.accounts.find((a) => a.id === id && a.workspaceId === workspaceId);
  if (acc) acc.archived = true;
  saveDb(db);
}

export function addTransaction(tx: Transaction) {
  const db = loadDb();
  db.transactions.push(tx);
  saveDb(db);
}

export function deleteTransaction(id: string, workspaceId: string) {
  const db = loadDb();
  db.transactions = db.transactions.filter((t) => !(t.id === id && t.workspaceId === workspaceId));
  saveDb(db);
}

export function upsertBudget(row: Budget) {
  const db = loadDb();
  const i = db.budgets.findIndex(
    (b) => b.workspaceId === row.workspaceId && b.categoryId === row.categoryId && b.month === row.month,
  );
  if (i >= 0) db.budgets[i] = { ...db.budgets[i], amount: row.amount };
  else db.budgets.push(row);
  saveDb(db);
}

export function listAccounts(workspaceId: string, includeArchived = false) {
  return loadDb()
    .accounts.filter((a) => a.workspaceId === workspaceId && (includeArchived || !a.archived))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listCategories(workspaceId: string) {
  return loadDb()
    .categories.filter((c) => c.workspaceId === workspaceId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function listTransactions(workspaceId: string) {
  return loadDb().transactions.filter((t) => t.workspaceId === workspaceId);
}

export function listBudgets(workspaceId: string, month: string) {
  return loadDb().budgets.filter((b) => b.workspaceId === workspaceId && b.month === month);
}

export function listWorkspaces(userId: string) {
  return loadDb()
    .workspaces.filter((w) => w.ownerId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function listLogs(userId: string) {
  return loadDb().auditLogs.filter((l) => l.userId === userId).slice(0, 12);
}
