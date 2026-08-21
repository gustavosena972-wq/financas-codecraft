"use client";

import Link from "next/link";

export function PageHeader({
  kicker,
  title,
  subtitle,
  actions,
}: {
  kicker?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        {kicker ? <p className="page-kicker">{kicker}</p> : null}
        <h1 className="page-title">{title}</h1>
        {subtitle ? <p className="text-sm text-muted mt-1 max-w-2xl">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PlanGate({
  allowed,
  title,
  body,
}: {
  allowed: boolean;
  title: string;
  body: string;
}) {
  if (allowed) return null;
  return (
    <div className="card p-8 text-center space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm text-muted max-w-lg mx-auto">{body}</p>
      <Link href="/app/planos" className="btn btn-primary">
        Ver planos
      </Link>
    </div>
  );
}
