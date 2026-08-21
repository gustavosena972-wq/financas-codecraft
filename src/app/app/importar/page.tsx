"use client";

import { ImportWizard } from "@/components/import-wizard";
import { OrganizeWizard } from "@/components/organize-wizard";
import {
  buildBusinessSampleBuffer,
  buildPersonalSampleBuffer,
  buildTemplateBuffer,
  buildYearBudgetSampleBuffer,
} from "@/lib/excel";

async function downloadBuffer(buffer: Awaited<ReturnType<typeof buildTemplateBuffer>>, filename: string) {
  const blob = new Blob([buffer as ArrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Planilha</h1>
        <p className="text-sm text-muted">
          Pegue o arquivo salvo no computador — orçamento do ano ou do mês. Organizamos, você entende e pode mandar para o app.
        </p>
      </div>
      <div className="card p-5 space-y-3">
        <div className="font-medium">Se ainda não tem arquivo</div>
        <p className="text-sm text-muted">Baixe um modelo, preencha no Excel e traga de volta.</p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-ghost"
            onClick={async () => downloadBuffer(await buildTemplateBuffer(), "financas-codecraft-modelo.xlsx")}
          >
            Modelo de lançamentos
          </button>
          <button
            className="btn btn-primary"
            onClick={async () =>
              downloadBuffer(await buildYearBudgetSampleBuffer(), "financas-codecraft-orcamento-ano.xlsx")
            }
          >
            Exemplo orçamento do ano
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () =>
              downloadBuffer(await buildPersonalSampleBuffer(), "financas-codecraft-exemplo-pessoal.xlsx")
            }
          >
            Exemplo pessoal
          </button>
          <button
            className="btn btn-ghost"
            onClick={async () =>
              downloadBuffer(await buildBusinessSampleBuffer(), "financas-codecraft-exemplo-empresa.xlsx")
            }
          >
            Exemplo empresa
          </button>
        </div>
      </div>
      <OrganizeWizard />
      <div>
        <h2 className="font-semibold mb-2">Já está no modelo padrão?</h2>
        <p className="text-sm text-muted mb-3">Valida linha a linha e avisa duplicata antes de gravar.</p>
        <ImportWizard />
      </div>
    </div>
  );
}
