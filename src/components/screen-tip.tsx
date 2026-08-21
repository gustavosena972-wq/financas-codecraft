"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { guideForPath } from "@/lib/guide";
import type { WorkspaceKind } from "@/lib/nav";

export function ScreenTip({ mode }: { mode: WorkspaceKind }) {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/app";
  if (pathname === "/app/comecar") return null;
  const item = guideForPath(pathname);
  if (!item) return null;
  const who = item.audience ?? "all";
  if (who === "company" && mode !== "BUSINESS") return null;
  if (who === "personal" && mode !== "PERSONAL") return null;
  return (
    <div className="screen-tip">
      <span>
        <strong>{item.title}.</strong> {item.does} {item.tip}
      </span>
      <Link href="/app/comecar">Como usar</Link>
    </div>
  );
}
