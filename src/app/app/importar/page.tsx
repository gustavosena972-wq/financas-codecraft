"use client";

import Link from "next/link";
import { OrganizeWizard } from "@/components/organize-wizard";
import { DeleteHouseSheet } from "@/components/delete-house-sheet";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mandar planilha</h1>
        <p className="text-sm text-muted max-w-2xl">
          Manda o Excel da casa. Se já tem um ano velho, apaga ele primeiro: o app zera na hora. Depois entra a planilha nova.
        </p>
      </div>
      <DeleteHouseSheet />
      <OrganizeWizard />
      <p className="text-sm text-muted">
        Prefere anotar na mão? <Link href="/app/lancamentos" className="underline">Anotar um valor</Link>
        {" · "}
        <Link href="/app" className="underline">Falar no chat</Link>
      </p>
    </div>
  );
}
