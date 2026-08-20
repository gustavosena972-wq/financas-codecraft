"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/shell";
import { currentUser, listWorkspaces, requireSession } from "@/lib/store";
import { go } from "@/lib/types";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; type: "PERSONAL" | "BUSINESS" }[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const session = requireSession();
    const user = currentUser();
    if (!user || !session) {
      go("/login");
      return;
    }
    setName(user.name);
    setWorkspaces(listWorkspaces(user.id));
    setActiveId(session.workspace.id);
    setReady(true);
  }, []);

  if (!ready) return <div className="p-10 text-muted">Carregando…</div>;

  return (
    <AppShell userName={name} workspaces={workspaces} activeId={activeId}>
      {children}
    </AppShell>
  );
}
