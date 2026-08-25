"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/shell";
import { requireSession, startLiveSync, type Snapshot } from "@/lib/store";
import { useLive } from "@/lib/live";
import { go } from "@/lib/types";
import { supabaseConfigured } from "@/lib/supabase";
import { orgIsLinked } from "@/lib/company";
import { isSubscribed } from "@/lib/plans";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const live = useLive();
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/app";
  const [session, setSession] = useState<Snapshot | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    startLiveSync();
    void (async () => {
      if (!supabaseConfigured()) {
        setReady(true);
        return;
      }
      const data = await requireSession();
      if (!data) {
        go("/login");
        return;
      }
      setSession(data);
      setReady(true);
      if (!orgIsLinked(data.org) && pathname !== "/app/empresa") {
        go("/app/empresa");
        return;
      }
      const open =
        pathname === "/app/planos" || pathname === "/app/empresa" || pathname === "/app/ajustes";
      if (orgIsLinked(data.org) && !isSubscribed(data.user) && !open) {
        go("/app/planos");
      }
    })();
  }, [live, pathname]);

  if (!ready) return <p className="p-10 text-muted">Abrindo a empresa…</p>;
  if (!supabaseConfigured()) {
    return (
      <div className="p-10 max-w-xl space-y-3">
        <p className="kicker">Banco</p>
        <h1 className="title">Supabase do CodeCraft Gestão ainda não está ligado</h1>
        <p className="text-sm text-muted">
          Rode <code>supabase/schema.sql</code> no projeto deste app e confirme o <code>.env.local</code>.
        </p>
      </div>
    );
  }
  if (!session) return null;

  return <AppShell org={session.org}>{children}</AppShell>;
}
