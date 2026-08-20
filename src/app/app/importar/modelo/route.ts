import { buildTemplateBuffer } from "@/lib/excel";

export async function GET() {
  const buffer = await buildTemplateBuffer();
  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="financas-codecraft-modelo.xlsx"',
    },
  });
}
