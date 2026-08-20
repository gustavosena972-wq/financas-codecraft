import { requireWorkspace } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildExportBuffer } from "@/lib/excel";
import { endOfMonth, monthKey, startOfMonth } from "@/lib/money";

export async function GET(request: Request) {
  const { workspace } = await requireWorkspace();
  const url = new URL(request.url);
  const month = url.searchParams.get("month") ?? monthKey();
  const txs = await prisma.transaction.findMany({
    where: {
      workspaceId: workspace.id,
      date: { gte: startOfMonth(month), lte: endOfMonth(month) },
    },
    include: { account: true, category: true },
    orderBy: { date: "asc" },
  });
  const buffer = await buildExportBuffer(
    txs.map((tx) => ({
      date: tx.date,
      description: tx.description,
      amount: tx.amount,
      type: tx.type,
      category: tx.category?.name,
      account: tx.account.name,
      notes: tx.notes,
    })),
  );
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="financas-codecraft-${workspace.type.toLowerCase()}-${month}.xlsx"`,
    },
  });
}
