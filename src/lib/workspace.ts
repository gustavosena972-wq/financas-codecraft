import type { Account, Category, Workspace, WorkspaceType } from "./types";
import { defaultsFor } from "./defaults";
import { addWorkspace } from "./store";
import { newId, nowIso } from "./types";

export function provisionWorkspace(ownerId: string, name: string, type: WorkspaceType): Workspace {
  const defaults = defaultsFor(type);
  const ws: Workspace = { id: newId(), name, type, ownerId, createdAt: nowIso() };
  const accounts: Account[] = defaults.accounts.map((account) => ({
    id: newId(),
    workspaceId: ws.id,
    name: account.name,
    type: account.type,
    initialBalance: 0,
    archived: false,
    createdAt: nowIso(),
  }));
  const categories: Category[] = defaults.categories.map((category) => ({
    id: newId(),
    workspaceId: ws.id,
    name: category.name,
    kind: category.kind,
    color: category.color,
  }));
  addWorkspace(ws, accounts, categories);
  return ws;
}
