import { prisma } from "@/lib/prisma";
import { requireUser, getActiveWorkspaceId } from "@/lib/auth";
import { AppShell } from "@/components/shell";
import { redirect } from "next/navigation";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const workspaces = await prisma.workspace.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (!workspaces.length) redirect("/cadastro");
  const activeId = (await getActiveWorkspaceId(user.id)) ?? workspaces[0].id;

  return (
    <AppShell userName={user.name} workspaces={workspaces} activeId={activeId}>
      {children}
    </AppShell>
  );
}
