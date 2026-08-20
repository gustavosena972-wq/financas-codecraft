"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  audit,
  clearSession,
  createSession,
  hashPassword,
  requireUser,
  setActiveWorkspace,
  verifyPassword,
} from "@/lib/auth";
import { provisionWorkspace } from "@/lib/workspace";
import { ensureDemoUser } from "@/lib/demo";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome"),
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
  mode: z.enum(["PERSONAL", "BUSINESS", "BOTH"]),
  company: z.string().trim().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido").toLowerCase(),
  password: z.string().min(1, "Informe a senha"),
});

export type AuthState = { error?: string } | null;

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    mode: formData.get("mode"),
    company: formData.get("company"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (exists) return { error: "Já existe uma conta com este e-mail." };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await hashPassword(parsed.data.password),
    },
  });

  const makePersonal = parsed.data.mode === "PERSONAL" || parsed.data.mode === "BOTH";
  const makeBusiness = parsed.data.mode === "BUSINESS" || parsed.data.mode === "BOTH";

  let firstId: string | null = null;
  if (makePersonal) {
    const ws = await provisionWorkspace(user.id, "Pessoal", "PERSONAL");
    firstId = ws.id;
  }
  if (makeBusiness) {
    const ws = await provisionWorkspace(
      user.id,
      parsed.data.company || "Empresa",
      "BUSINESS",
    );
    firstId = firstId ?? ws.id;
  }

  if (firstId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { lastWorkspaceId: firstId },
    });
    await createSession(user.id);
    await setActiveWorkspace(user.id, firstId);
  } else {
    await createSession(user.id);
  }

  await audit(user.id, "create", "user", { detail: "cadastro" });
  redirect("/app");
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { error: "E-mail ou senha incorretos." };
  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return { error: "E-mail ou senha incorretos." };

  await createSession(user.id);
  if (user.lastWorkspaceId) await setActiveWorkspace(user.id, user.lastWorkspaceId);
  redirect("/app");
}

export async function demoLoginAction(): Promise<void> {
  const user = await ensureDemoUser();
  await createSession(user.id);
  if (user.lastWorkspaceId) await setActiveWorkspace(user.id, user.lastWorkspaceId);
  await audit(user.id, "login", "user", { detail: "demo" });
  redirect("/app");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function switchWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const workspace = await prisma.workspace.findFirst({
    where: { id: workspaceId, ownerId: user.id },
  });
  if (!workspace) return;
  await setActiveWorkspace(user.id, workspace.id);
  redirect("/app");
}
