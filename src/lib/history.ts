import { newId, nowIso } from "./types";

export type SearchHit = {
  id: string;
  text: string;
  at: string;
  threadId: string;
  workspaceId: string;
};

const KEEP = new Set(["fc-theme", "ccs-financas-ws"]);

function searchKey(userId: string) {
  return `fc-searches-${userId}`;
}

export function listSearches(userId: string, workspaceId?: string): SearchHit[] {
  if (!userId || typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(searchKey(userId));
    const all = raw ? (JSON.parse(raw) as SearchHit[]) : [];
    const rows = Array.isArray(all) ? all : [];
    const filtered = workspaceId ? rows.filter((row) => row.workspaceId === workspaceId) : rows;
    return filtered.slice(0, 80);
  } catch {
    return [];
  }
}

export function pushSearch(userId: string, hit: Omit<SearchHit, "id" | "at">) {
  if (!userId || typeof window === "undefined") return;
  const text = hit.text.trim();
  if (!text) return;
  const next: SearchHit = { ...hit, id: newId(), text: text.slice(0, 180), at: nowIso() };
  try {
    const current = listSearches(userId);
    const rows = [next, ...current.filter((row) => row.text !== next.text || row.workspaceId !== next.workspaceId)].slice(0, 80);
    localStorage.setItem(searchKey(userId), JSON.stringify(rows));
  } catch {
    /* ignore */
  }
}

export function clearSearches(userId: string) {
  if (!userId) return;
  try {
    localStorage.removeItem(searchKey(userId));
  } catch {
    /* ignore */
  }
}

export function wipePlatformHistory(userId?: string) {
  if (typeof window === "undefined") return;
  const extra: string[] = [];
  if (userId) extra.push(searchKey(userId), `fc-chat-asks-${userId}`);
  try {
    const keys: string[] = [...extra];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key || KEEP.has(key)) continue;
      if (
        key.startsWith("fc-chat") ||
        key.startsWith("fc-searches") ||
        key.startsWith("fc-welcome") ||
        key.startsWith("fc-cut-tips") ||
        key === "fc-pending-company-size"
      ) {
        keys.push(key);
      }
    }
    for (const key of new Set(keys)) localStorage.removeItem(key);
    sessionStorage.removeItem("fc-ask");
  } catch {
    /* ignore */
  }
}
