import { z } from "zod";
import {
  findUserByEmail,
  loadDb,
  pushAudit,
  saveDb,
  setSessionWorkspaceId,
} from "@/lib/store";
import { provisionWorkspace } from "@/lib/workspace";
import { ensureDemoUser, hashPassword, loginSession, logoutSession, verifyPassword } from "@/lib/demo";
import { go, newId, nowIso } from "@/lib/types";

export type AuthState = { error?: string } | null;

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

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    mode: formData.get("mode"),
    company: formData.get("company"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  if (findUserByEmail(parsed.data.email)) return { error: "Já existe uma conta com este e-mail." };

  const user = {
    id: newId(),
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash: await hashPassword(parsed.data.password),
    lastWorkspaceId: null as string | null,
    createdAt: nowIso(),
  };
  const db = loadDb();
  db.users.push(user);
  saveDb(db);

  let firstId: string | null = null;
  if (parsed.data.mode === "PERSONAL" || parsed.data.mode === "BOTH") {
    firstId = provisionWorkspace(user.id, "Pessoal", "PERSONAL").id;
  }
  if (parsed.data.mode === "BUSINESS" || parsed.data.mode === "BOTH") {
    const ws = provisionWorkspace(user.id, parsed.data.company || "Empresa", "BUSINESS");
    firstId = firstId ?? ws.id;
  }
  const next = loadDb();
  const me = next.users.find((u) => u.id === user.id)!;
  me.lastWorkspaceId = firstId;
  pushAudit(next, user.id, "create", "user", { detail: "cadastro" });
  saveDb(next);
  loginSession(user.id, firstId);
  go("/app");
  return null;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  const user = findUserByEmail(parsed.data.email);
  if (!user) return { error: "E-mail ou senha incorretos." };
  if (!(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "E-mail ou senha incorretos." };
  }
  loginSession(user.id, user.lastWorkspaceId);
  go("/app");
  return null;
}

export async function demoLoginAction() {
  const user = await ensureDemoUser();
  loginSession(user.id, user.lastWorkspaceId);
  go("/app");
}

export async function logoutAction() {
  logoutSession();
  go("/");
}

export async function switchWorkspaceAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  if (!workspaceId) return;
  setSessionWorkspaceId(workspaceId);
  const db = loadDb();
  const userId = db.users.find((u) => u.id)?.id;
  void userId;
  const sessionId = localStorage.getItem("ccs-financas-user");
  if (sessionId) {
    const me = db.users.find((u) => u.id === sessionId);
    if (me) me.lastWorkspaceId = workspaceId;
    saveDb(db);
  }
  go("/app");
}
