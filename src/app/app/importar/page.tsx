"use client";

import Link from "next/link";
import { OrganizeWizard } from "@/components/organize-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mandar planilha</h1>
        <p className="text-sm text-muted max-w-2xl">
          Manda OFX, CSV ou Excel. O app lê, sugere categoria e só lança se você aceitar. Sem modelo para baixar.
        </p>
      </div>
      <OrganizeWizard />
      <p className="text-sm text-muted">
        Prefere digitar? <Link href="/app/lancamentos" className="underline">Lançar na mão</Link>
        {" · "}
        <Link href="/app" className="underline">Falar no chat</Link>
      </p>
    </div>
  );
}
