"use client";

import Link from "next/link";
import { OrganizeWizard } from "@/components/organize-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mandar planilha</h1>
        <p className="text-sm text-muted max-w-2xl">
          Manda o Excel da casa: uma aba por mês (Jan, Fev, Mar…). O app lê cartão, contas fixas e o que varia. OFX e CSV também entram.
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
