"use client";

import { ImportWizard } from "@/components/import-wizard";
import { buildTemplateBuffer } from "@/lib/excel";

export default function ImportPage() {
  async function downloadTemplate() {
    const buffer = await buildTemplateBuffer();
    const blob = new Blob([buffer as ArrayBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "financas-codecraft-modelo.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Importar planilha</h1>
          <p className="text-sm text-muted">Excel ou CSV, com validação e detecção de duplicidade.</p>
        </div>
        <button className="btn btn-ghost" onClick={downloadTemplate}>Baixar modelo padrão</button>
      </div>
      <ImportWizard />
    </div>
  );
}
