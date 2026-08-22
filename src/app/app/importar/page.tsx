"use client";

import Link from "next/link";
import { OrganizeWizard } from "@/components/organize-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Mandar planilha</h1>
        <p className="text-sm text-muted max-w-2xl">
          Manda o Excel da casa uma vez. O app lê e passa a dizer o que vai gastar, o que sobra no mês e no ano, e avalia isso todo dia. Não é para ver a mesma tabela.
        </p>
      </div>
      <OrganizeWizard />
      <p className="text-sm text-muted">
        Prefere anotar na mão? <Link href="/app/lancamentos" className="underline">Anotar um valor</Link>
        {" · "}
        <Link href="/app" className="underline">Falar no chat</Link>
      </p>
    </div>
  );
}
