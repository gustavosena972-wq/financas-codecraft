import { z } from "zod";
import {
  ensureProfile,
  logoutSession,
  pushAudit,
  refreshSession,
  setLastWorkspace,
  setSessionWorkspaceId,
} from "@/lib/store";
import { provisionWorkspace } from "@/lib/workspace";
import { ensureDemoUser } from "@/lib/demo";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { go } from "@/lib/types";

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

function authMessage(message?: string) {
  if (!message) return "Não foi possível entrar.";
  if (message.includes("Invalid login")) return "E-mail ou senha incorretos.";
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (message.toLowerCase().includes("confirm")) {
    return "Confirme o e-mail no Supabase ou desative Confirm email neste projeto.";
  }
  return message;
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    mode: formData.get("mode"),
    company: formData.get("company"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  if (!supabaseConfigured()) return { error: "O banco do Finanças ainda não foi ligado no Supabase." };
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });
  if (error || !data.user) return { error: authMessage(error?.message) };
  try {
    await ensureProfile(data.user.id, parsed.data.name);
    let firstId: string | null = null;
    if (parsed.data.mode === "PERSONAL" || parsed.data.mode === "BOTH") {
      firstId = (await provisionWorkspace(data.user.id, "Pessoal", "PERSONAL")).id;
    }
    if (parsed.data.mode === "BUSINESS" || parsed.data.mode === "BOTH") {
      const ws = await provisionWorkspace(data.user.id, parsed.data.company || "Empresa", "BUSINESS");
      firstId = firstId ?? ws.id;
    }
    if (firstId) await setLastWorkspace(data.user.id, firstId);
    await pushAudit(data.user.id, "create", "user", { detail: "cadastro" });
    await refreshSession();
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Conta criada, mas a base não aceitou os dados." };
  }
  go("/app");
  return null;
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  if (!supabaseConfigured()) return { error: "O banco do Finanças ainda não foi ligado no Supabase." };
  const { error } = await getSupabase().auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  if (error) return { error: authMessage(error.message) };
  await refreshSession();
  go("/app");
  return null;
}

export async function demoLoginAction(_prev: AuthState, _formData: FormData): Promise<AuthState> {
  if (!supabaseConfigured()) return { error: "O banco do Finanças ainda não foi ligado no Supabase." };
  try {
    await ensureDemoUser();
    go("/app");
    return null;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Não foi possível abrir a demonstração." };
  }
}

export async function logoutAction() {
  await logoutSession();
  go("/");
}

export async function switchWorkspaceAction(formData: FormData) {
  const workspaceId = String(formData.get("workspaceId") ?? "");
  if (!workspaceId) return;
  setSessionWorkspaceId(workspaceId);
  const session = await refreshSession();
  if (session?.user) await setLastWorkspace(session.user.id, workspaceId);
  go("/app");
}
