"use client";

import Link from "next/link";
import { CreditCard, LogOut } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { ThemeToggle } from "./theme-toggle";
import { AppNav } from "./nav";
import { logoutAccount } from "@/lib/store";
import { go, type Org } from "@/lib/types";
import { displayCompany, formatCnpj, orgIsLinked } from "@/lib/company";

export function AppShell({ org, children }: { org: Org; children: React.ReactNode }) {
  const company = displayCompany(org);
  const linked = orgIsLinked(org);
  return (
    <div className="min-h-screen">
      <header className="app-top">
        <div className="flex items-center gap-3 min-w-0">
          <BrandLogo href="/app" />
          <span className="chip hidden sm:inline-flex">{company}</span>
          {linked ? (
            <span className="chip ok hidden md:inline-flex">CNPJ {formatCnpj(org.cnpj)}</span>
          ) : (
            <span className="chip warn hidden md:inline-flex">empresa não ligada</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/planos" className="btn btn-primary hidden sm:inline-flex">
            <CreditCard size={15} />
            Assinatura
          </Link>
          <ThemeToggle />
          <button
            className="btn btn-ghost"
            type="button"
            title="Sair"
            onClick={async () => {
              await logoutAccount();
              go("/login");
            }}
          >
            <LogOut size={15} />
          </button>
        </div>
      </header>
      <div className="app-frame">
        <AppNav />
        <main className="p-6 lg:p-8 max-w-6xl min-w-0">{children}</main>
      </div>
    </div>
  );
}

export function PageHead({
  kicker,
  title,
  subtitle,
  extra,
}: {
  kicker: string;
  title: string;
  subtitle: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
      <div>
        <p className="kicker">{kicker}</p>
        <h1 className="title">{title}</h1>
        <p className="text-sm text-muted mt-1 max-w-2xl">{subtitle}</p>
      </div>
      {extra}
    </div>
  );
}

export function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-8 text-center">
      <h2 className="font-bold">{title}</h2>
      <p className="text-sm text-muted mt-2">{body}</p>
    </div>
  );
}

export function Gate({ allowed, title, body }: { allowed: boolean; title: string; body: string }) {
  if (allowed) return null;
  return (
    <div className="card p-8 text-center space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted max-w-lg mx-auto">{body}</p>
      <a href="/app/planos" className="btn btn-primary">
        Ver assinatura
      </a>
    </div>
  );
}
