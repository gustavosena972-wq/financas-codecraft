"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { guideForPath } from "@/lib/guide";

export function ScreenTip() {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/app";
  if (pathname === "/app/comecar") return null;
  const item = guideForPath(pathname);
  if (!item) return null;
  return (
    <div className="screen-tip">
      <span>
        <strong>{item.title}.</strong> {item.does} {item.tip}
      </span>
      <Link href="/app/comecar">Como usar</Link>
    </div>
  );
}
