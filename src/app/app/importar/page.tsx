import { ImportWizard } from "@/components/import-wizard";

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">Importar planilha</h1>
          <p className="text-sm text-muted">
            Excel ou CSV, com mapeamento de colunas, validação e detecção de duplicidade.
          </p>
        </div>
        <a className="btn btn-ghost" href="/app/importar/modelo">
          Baixar modelo padrão
        </a>
      </div>
      <ImportWizard />
    </div>
  );
}
