"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { audit, requireWorkspace } from "@/lib/auth";
import { parseISODate } from "@/lib/money";
import { parseWorkbook, type MappedRow } from "@/lib/excel";

export type ImportPreview = {
  error?: string;
  headers?: string[];
  rows?: MappedRow[];
  duplicates?: number;
};

export async function previewImportAction(formData: FormData): Promise<ImportPreview> {
  const { workspace } = await requireWorkspace();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Selecione um arquivo Excel ou CSV." };
  }
  const buffer = await file.arrayBuffer();
  const parsed = await parseWorkbook(buffer, file.name);
  if (parsed.error) return { error: parsed.error, headers: parsed.headers };

  const hashes = parsed.rows.map((r) => r.hash);
  const existing = await prisma.transaction.findMany({
    where: { workspaceId: workspace.id, importHash: { in: hashes } },
    select: { importHash: true },
  });
  const existingSet = new Set(existing.map((e) => e.importHash));
  const rows = parsed.rows.map((row) =>
    existingSet.has(row.hash)
      ? { ...row, issues: [...row.issues, "Possível duplicata"] }
      : row,
  );
  return {
    headers: parsed.headers,
    rows,
    duplicates: rows.filter((r) => r.issues.includes("Possível duplicata")).length,
  };
}

export async function confirmImportAction(rowsJson: string) {
  const { user, workspace } = await requireWorkspace();
  const rows = JSON.parse(rowsJson) as MappedRow[];
  const valid = rows.filter((row) => row.issues.length === 0 && row.amount > 0 && row.date);
  if (!valid.length) return { error: "Nenhuma linha válida para importar." };

  const accounts = await prisma.account.findMany({
    where: { workspaceId: workspace.id, archived: false },
  });
  const categories = await prisma.category.findMany({
    where: { workspaceId: workspace.id },
  });
  const defaultAccount = accounts[0];
  if (!defaultAccount) return { error: "Crie ao menos uma conta antes de importar." };

  const findAccount = (name?: string) => {
    if (!name) return defaultAccount;
    const n = name.toLowerCase();
    return accounts.find((a) => a.name.toLowerCase() === n) ?? defaultAccount;
  };
  const findCategory = (name?: string, type?: string) => {
    if (!name) return null;
    const n = name.toLowerCase();
    return (
      categories.find(
        (c) => c.name.toLowerCase() === n && (!type || c.kind === type),
      ) ?? null
    );
  };

  let created = 0;
  for (const row of valid) {
    const exists = await prisma.transaction.findFirst({
      where: { workspaceId: workspace.id, importHash: row.hash },
    });
    if (exists) continue;
    await prisma.transaction.create({
      data: {
        workspaceId: workspace.id,
        accountId: findAccount(row.account).id,
        categoryId: findCategory(row.category, row.type)?.id ?? null,
        type: row.type,
        amount: row.amount,
        date: parseISODate(row.date),
        description: row.description,
        notes: row.notes,
        importHash: row.hash,
      },
    });
    created += 1;
  }

  await audit(user.id, "import", "transaction", {
    workspaceId: workspace.id,
    detail: `${created} lançamentos`,
  });
  revalidatePath("/app");
  revalidatePath("/app/lancamentos");
  revalidatePath("/app/fluxo");
  return { ok: `${created} lançamentos importados.`, created };
}
