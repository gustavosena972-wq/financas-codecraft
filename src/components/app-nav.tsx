"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navFor, type WorkspaceKind } from "@/lib/nav";

export function AppNav({ kind }: { kind: WorkspaceKind }) {
  const pathname = (usePathname() || "").replace(/\/$/, "") || "/app";
  const groups = navFor(kind);

  return (
    <>
      <aside className="app-side">
        {groups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-3 text-[10px] uppercase tracking-[0.16em] text-muted font-semibold mb-1">{group.label}</p>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const on = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link key={item.href} href={item.href} className={`nav-link flex items-center gap-2 px-3 py-2 text-sm rounded-lg ${on ? "on bg-bg-2 text-ink font-semibold" : "text-muted"}`}>
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </aside>
      <div className="app-side-mobile">
        {groups.flatMap((group) => group.items).map((item) => {
          const on = item.href === "/app" ? pathname === "/app" : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} className={`app-side-chip ${on ? "on" : ""}`}>
              {item.label}
            </Link>
          );
        })}
      </div>
    </>
  );
}
