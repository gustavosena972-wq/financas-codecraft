"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { listWorkspaces, requireSession, setLastWorkspace } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { ensureBothWorkspacesAction } from "@/app/actions/auth";
import { cleanStackedHouseAction } from "@/app/actions/import";

const HOUSE_FIRST_KEY = "fc-house-first-v2";
const HOUSE_CLEAN_KEY = "fc-house-clean-v3";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const live = useLive();
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; type: "PERSONAL" | "BUSINESS" }[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    void (async () => {
      const session = await requireSession();
      const user = session?.user;
      if (!user || !session) {
        go("/login");
        return;
      }
      await ensureBothWorkspacesAction();
      let again = await requireSession();
      if (!again) {
        go("/login");
        return;
      }
      const spaces = listWorkspaces(again.user.id);
      const person = spaces.find((ws) => ws.type === "PERSONAL");
      if (person && typeof window !== "undefined" && !window.localStorage.getItem(HOUSE_FIRST_KEY)) {
        window.localStorage.setItem(HOUSE_FIRST_KEY, "1");
        if (again.workspace.id !== person.id) {
          await setLastWorkspace(again.user.id, person.id);
          again = (await requireSession()) ?? again;
        }
      }
      if (again.workspace.type === "PERSONAL" && typeof window !== "undefined") {
        const cleaned = await cleanStackedHouseAction();
        if (cleaned.removed > 0 || !window.localStorage.getItem(HOUSE_CLEAN_KEY)) {
          window.localStorage.setItem(HOUSE_CLEAN_KEY, "1");
          again = (await requireSession()) ?? again;
        }
      }
      setName(again.user.name);
      setWorkspaces(listWorkspaces(again.user.id));
      setActiveId(again.workspace.id);
      setReady(true);
    })();
  }, [live]);

  if (!ready) return <div className="p-10 text-muted">Carregando…</div>;

  return (
    <AppShell userName={name} workspaces={workspaces} activeId={activeId}>
      {children}
    </AppShell>
  );
}
