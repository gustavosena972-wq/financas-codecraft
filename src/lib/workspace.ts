import { prisma } from "./prisma";
import { defaultsFor } from "./defaults";
import type { WorkspaceType } from "@prisma/client";

export async function provisionWorkspace(
  ownerId: string,
  name: string,
  type: WorkspaceType,
) {
  const defaults = defaultsFor(type);
  return prisma.workspace.create({
    data: {
      name,
      type,
      ownerId,
      accounts: {
        create: defaults.accounts.map((account) => ({
          name: account.name,
          type: account.type,
        })),
      },
      categories: {
        create: defaults.categories.map((category) => ({
          name: category.name,
          kind: category.kind,
          color: category.color,
        })),
      },
    },
  });
}
