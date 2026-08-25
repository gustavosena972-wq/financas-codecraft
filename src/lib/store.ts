import type {
  Bill,
  CostCenter,
  Move,
  Org,
  OrgInvite,
  PayrollLine,
  PayrollRun,
  Person,
  PlanId,
  Profile,
  TimePunch,
  Wallet,
} from "./types";
import { newId, nowIso, today } from "./types";
import { getSupabase, supabaseConfigured } from "./supabase";
import { hasFinance, isSubscribed, parsePlan, peopleLimit } from "./plans";
import { readCard } from "./card";
import { competenceBounds, competenceNow, workedMinutes } from "./payroll";

export type Snapshot = {
  user: Profile;
  org: Org;
  isOwner: boolean;
  people: Person[];
  punches: TimePunch[];
  wallets: Wallet[];
  moves: Move[];
  bills: Bill[];
  costCenters: CostCenter[];
  invites: OrgInvite[];
  payrollRuns: PayrollRun[];
};

let snapshot: Snapshot | null = null;
let loading: Promise<Snapshot | null> | null = null;
let storeVersion = 0;
let liveStarted = false;
let liveTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

export function getStoreVersion() {
  return storeVersion;
}

export function subscribeStore(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function bump() {
  storeVersion += 1;
  listeners.forEach((fn) => fn());
}

function parseBilling(value: unknown): Profile["billingStatus"] {
  if (value === "active" || value === "past_due") return value;
  return "inactive";
}

function parseSize(value: unknown): Org["size"] {
  if (value === "mei" || value === "media" || value === "grande") return value;
  return "pequena";
}

function mapOrg(row: Record<string, unknown>): Org {
  return {
    id: String(row.id),
    ownerId: String(row.owner_id),
    name: String(row.name),
    size: parseSize(row.size),
    createdAt: String(row.created_at ?? nowIso()),
    legalName: String(row.legal_name ?? ""),
    tradeName: String(row.trade_name ?? ""),
    cnpj: String(row.cnpj ?? ""),
    ie: String(row.ie ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    cep: String(row.cep ?? ""),
    street: String(row.street ?? ""),
    number: String(row.number ?? ""),
    district: String(row.district ?? ""),
    city: String(row.city ?? ""),
    state: String(row.state ?? ""),
    activity: String(row.activity ?? ""),
    legalRep: String(row.legal_rep ?? ""),
    situation: String(row.situation ?? ""),
    linkedAt: row.linked_at ? String(row.linked_at) : null,
  };
}

function mapPerson(row: Record<string, unknown>): Person {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
    email: String(row.email ?? ""),
    document: String(row.document ?? ""),
    department: (row.department as Person["department"]) || "OPERACOES",
    roleTitle: String(row.role_title ?? ""),
    role: (row.role as Person["role"]) || "MEMBER",
    status: (row.status as Person["status"]) || "ACTIVE",
    salary: Number(row.salary ?? 0),
    benefits: String(row.benefits ?? ""),
    startedAt: String(row.started_at ?? today()),
  };
}

function mapPunch(row: Record<string, unknown>): TimePunch {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    personId: String(row.person_id),
    kind: (row.kind as TimePunch["kind"]) || "IN",
    at: String(row.at ?? nowIso()),
    note: String(row.note ?? ""),
  };
}

function mapWallet(row: Record<string, unknown>): Wallet {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
    kind: (row.kind as Wallet["kind"]) || "BANK",
    opening: Number(row.opening ?? 0),
  };
}

function mapMove(row: Record<string, unknown>): Move {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    walletId: String(row.wallet_id),
    type: row.type === "OUT" ? "OUT" : "IN",
    amount: Number(row.amount ?? 0),
    date: String(row.date ?? today()),
    description: String(row.description),
    category: String(row.category ?? "Geral"),
    costCenter: String(row.cost_center ?? "Geral"),
  };
}

function mapBill(row: Record<string, unknown>): Bill {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    kind: row.kind === "GET" ? "GET" : "PAY",
    party: String(row.party),
    description: String(row.description),
    amount: Number(row.amount ?? 0),
    due: String(row.due),
    status: row.status === "PAID" ? "PAID" : "OPEN",
  };
}

function mapCostCenter(row: Record<string, unknown>): CostCenter {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
  };
}

function mapInvite(row: Record<string, unknown>): OrgInvite {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    email: String(row.email),
    token: String(row.token),
    role: row.role === "MEMBER" ? "MEMBER" : "ADMIN",
    expiresAt: String(row.expires_at),
    claimedAt: row.claimed_at ? String(row.claimed_at) : null,
    createdAt: String(row.created_at ?? nowIso()),
  };
}

function mapPayrollLine(row: Record<string, unknown>): PayrollLine {
  return {
    id: String(row.id),
    runId: String(row.run_id),
    orgId: String(row.org_id),
    personId: String(row.person_id),
    personName: String(row.person_name),
    salaryCents: Number(row.salary_cents ?? 0),
    hoursMinutes: Number(row.hours_minutes ?? 0),
  };
}

async function resolveOrgRow(supabase: ReturnType<typeof getSupabase>, userId: string, lastOrgId: string | null) {
  if (lastOrgId) {
    const owned = await supabase.from("cc_orgs").select("*").eq("id", lastOrgId).eq("owner_id", userId).maybeSingle();
    if (owned.data) return owned.data as Record<string, unknown>;
    const member = await supabase.from("cc_org_members").select("org_id").eq("org_id", lastOrgId).eq("user_id", userId).maybeSingle();
    if (member.data) {
      const org = await supabase.from("cc_orgs").select("*").eq("id", lastOrgId).maybeSingle();
      if (org.data) return org.data as Record<string, unknown>;
    }
  }
  const { data: ownedList } = await supabase.from("cc_orgs").select("*").eq("owner_id", userId).order("created_at");
  if (ownedList?.[0]) return ownedList[0] as Record<string, unknown>;
  const { data: memberships } = await supabase
    .from("cc_org_members")
    .select("org_id")
    .eq("user_id", userId)
    .order("created_at");
  const mid = memberships?.[0]?.org_id;
  if (!mid) return null;
  const { data: org } = await supabase.from("cc_orgs").select("*").eq("id", mid).maybeSingle();
  return (org as Record<string, unknown>) ?? null;
}

export function current(): Snapshot | null {
  return snapshot;
}

export async function refreshSession() {
  if (loading) return loading;
  loading = loadSnapshot();
  try {
    return await loading;
  } finally {
    loading = null;
  }
}

async function loadSnapshot(): Promise<Snapshot | null> {
  if (!supabaseConfigured()) {
    snapshot = null;
    return null;
  }
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    snapshot = null;
    return null;
  }
  const auth = authData.user;
  const { data: profile } = await supabase.from("cc_profiles").select("*").eq("id", auth.id).maybeSingle();
  const orgRow = await resolveOrgRow(supabase, auth.id, (profile?.last_org_id as string) ?? null);
  if (!orgRow) {
    snapshot = null;
    return null;
  }
  const org = mapOrg(orgRow);
  const isOwner = org.ownerId === auth.id;
  const [people, punches, wallets, moves, bills, costCenters, invites, runs, lines] = await Promise.all([
    supabase.from("cc_people").select("*").eq("org_id", org.id).order("created_at"),
    supabase.from("cc_time_clock").select("*").eq("org_id", org.id).order("at", { ascending: false }).limit(400),
    supabase.from("cc_wallets").select("*").eq("org_id", org.id).order("created_at"),
    supabase.from("cc_moves").select("*").eq("org_id", org.id).order("date", { ascending: false }),
    supabase.from("cc_bills").select("*").eq("org_id", org.id).order("due"),
    supabase.from("cc_cost_centers").select("*").eq("org_id", org.id).order("name"),
    isOwner
      ? supabase.from("cc_invites").select("*").eq("org_id", org.id).order("created_at", { ascending: false })
      : Promise.resolve({ data: [] as Record<string, unknown>[], error: null }),
    supabase.from("cc_payroll_runs").select("*").eq("org_id", org.id).order("competence", { ascending: false }).limit(12),
    supabase.from("cc_payroll_lines").select("*").eq("org_id", org.id),
  ]);

  const safeCost = costCenters.error ? [] : costCenters.data ?? [];
  const safeInvites = (invites as { data?: Record<string, unknown>[]; error?: unknown }).error
    ? []
    : ((invites as { data?: Record<string, unknown>[] }).data ?? []);
  const safeRuns = runs.error ? [] : runs.data ?? [];
  const safeLines = lines.error ? [] : lines.data ?? [];

  const lineRows = safeLines.map((row) => mapPayrollLine(row as Record<string, unknown>));
  const payrollRuns: PayrollRun[] = safeRuns.map((row) => {
    const run = row as Record<string, unknown>;
    const id = String(run.id);
    return {
      id,
      orgId: String(run.org_id),
      competence: String(run.competence),
      status: run.status === "PAID" ? "PAID" : "OPEN",
      totalCents: Number(run.total_cents ?? 0),
      paidAt: run.paid_at ? String(run.paid_at) : null,
      createdAt: String(run.created_at ?? nowIso()),
      lines: lineRows.filter((line) => line.runId === id),
    };
  });

  let user: Profile = {
    id: auth.id,
    email: auth.email ?? "",
    name: (profile?.name as string) || (auth.user_metadata?.name as string) || "Você",
    lastOrgId: (profile?.last_org_id as string) ?? org.id,
    plan: parsePlan(profile?.plan),
    billingStatus: parseBilling(profile?.billing_status),
    billingMethod: profile?.billing_method === "pix" || profile?.billing_method === "card" ? profile.billing_method : "",
    cardLast4: String(profile?.card_last4 ?? ""),
    cardBrand: String(profile?.card_brand ?? ""),
    cardExp: String(profile?.card_exp ?? ""),
    cardHolder: String(profile?.card_holder ?? ""),
    cardCpf: String(profile?.card_cpf ?? ""),
    creditCents: Number(profile?.credit_cents ?? 0),
    nextChargeAt: profile?.next_charge_at ? String(profile.next_charge_at) : null,
    billedAt: profile?.billed_at ? String(profile.billed_at) : null,
    createdAt: auth.created_at,
  };
  user = await renewIfDue(user);

  snapshot = {
    user,
    org,
    isOwner,
    people: (people.data ?? []).map((row) => mapPerson(row as Record<string, unknown>)),
    punches: (punches.data ?? []).map((row) => mapPunch(row as Record<string, unknown>)),
    wallets: (wallets.data ?? []).map((row) => mapWallet(row as Record<string, unknown>)),
    moves: (moves.data ?? []).map((row) => mapMove(row as Record<string, unknown>)),
    bills: (bills.data ?? []).map((row) => mapBill(row as Record<string, unknown>)),
    costCenters: safeCost.map((row) => mapCostCenter(row as Record<string, unknown>)),
    invites: safeInvites.map((row) => mapInvite(row)),
    payrollRuns,
  };
  return snapshot;
}

async function renewIfDue(user: Profile) {
  if (user.plan === "NONE" || !user.nextChargeAt) return user;
  const due = new Date(user.nextChargeAt);
  if (Number.isNaN(due.getTime()) || due > new Date()) return user;
  const { data, error } = await getSupabase().rpc("cc_renew_if_due");
  if (error || !data) return user;
  const row = data as Record<string, unknown>;
  return {
    ...user,
    billingStatus: parseBilling(row.billing_status),
    billingMethod: row.billing_method === "pix" || row.billing_method === "card" ? row.billing_method : user.billingMethod,
    creditCents: Number(row.credit_cents ?? user.creditCents),
    billedAt: row.billed_at ? String(row.billed_at) : user.billedAt,
    nextChargeAt: row.next_charge_at ? String(row.next_charge_at) : user.nextChargeAt,
  };
}

export async function requireSession() {
  if (!snapshot) await refreshSession();
  return snapshot;
}

export function startLiveSync() {
  if (liveStarted || typeof window === "undefined") return;
  liveStarted = true;
  liveTimer = setInterval(() => {
    void refreshSession().then(() => bump());
  }, 8000);
}

export function stopLiveSync() {
  if (liveTimer) clearInterval(liveTimer);
  liveTimer = null;
  liveStarted = false;
}

function authMessage(message?: string) {
  if (!message) return "Não deu para autenticar.";
  const lower = message.toLowerCase();
  if (lower.includes("failed to fetch") || lower.includes("networkerror") || lower.includes("fetch failed")) {
    return "Não foi possível conectar ao Supabase. O projeto do app está fora do ar ou a URL/chave está errada.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (lower.includes("already")) return "Já existe uma conta com este e-mail. Tente entrar.";
  if (lower.includes("confirm") || lower.includes("not confirmed")) {
    return "E-mail ainda não confirmado. No Supabase: SQL Editor → rode o arquivo supabase/fix-auth.sql → depois entre de novo.";
  }
  return message;
}

const CONFIRM_HINT =
  "Conta criada, mas o Supabase pediu confirmação de e-mail. Abra o projeto no Supabase → SQL Editor → cole e rode supabase/fix-auth.sql → volte aqui e clique Entrar com o mesmo e-mail e senha.";

async function bootstrapFromAuth(nameHint: string, companyHint: string, sizeHint?: Org["size"]) {
  const supabase = getSupabase();
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) return { session: null as Snapshot | null, error: authError?.message || "Sem usuário Auth." };
  const auth = authData.user;
  const name = nameHint || (auth.user_metadata?.name as string) || auth.email?.split("@")[0] || "Responsável";
  const company = companyHint || "Sua empresa";
  const size = sizeHint || "pequena";

  const { data: existingOrg, error: orgLookupError } = await supabase
    .from("cc_orgs")
    .select("id")
    .eq("owner_id", auth.id)
    .maybeSingle();
  if (orgLookupError) {
    const msg = orgLookupError.message.toLowerCase();
    if (msg.includes("relation") || msg.includes("does not exist") || orgLookupError.code === "42P01") {
      return {
        session: null,
        error: "Faltam as tabelas do CodeCraft Gestão. No Supabase → SQL Editor, rode o arquivo supabase/schema.sql e tente entrar de novo.",
      };
    }
    return { session: null, error: orgLookupError.message };
  }
  if (existingOrg?.id) {
    const session = await refreshSession();
    return { session, error: session ? null : "Empresa encontrada, mas a sessão não carregou." };
  }

  const orgId = newId();
  const walletId = newId();
  const personId = newId();
  const { error: profileError } = await supabase.from("cc_profiles").upsert({
    id: auth.id,
    name,
    last_org_id: orgId,
    plan: "NONE",
  });
  if (profileError) {
    return {
      session: null,
      error: profileError.message.toLowerCase().includes("relation")
        ? "Faltam as tabelas. Rode supabase/schema.sql no SQL Editor do Supabase."
        : profileError.message,
    };
  }
  const { error: orgError } = await supabase.from("cc_orgs").insert({
    id: orgId,
    owner_id: auth.id,
    name: company,
    size,
  });
  if (orgError) return { session: null, error: orgError.message };
  await supabase.from("cc_org_members").upsert({ org_id: orgId, user_id: auth.id, role: "OWNER" });
  await supabase.from("cc_cost_centers").upsert({ id: newId(), org_id: orgId, name: "Geral" }, { onConflict: "org_id,name" });
  await supabase.from("cc_people").insert({
    id: personId,
    org_id: orgId,
    name,
    email: auth.email ?? "",
    department: "DIRECAO",
    role_title: "Responsável",
    role: "ADMIN",
    status: "ACTIVE",
    salary: 0,
    started_at: today(),
  });
  await supabase.from("cc_wallets").insert({
    id: walletId,
    org_id: orgId,
    name: "Conta PJ",
    kind: "BANK",
    opening: 0,
  });
  const session = await refreshSession();
  return { session, error: session ? null : "Empresa criada, mas a sessão não carregou. Tente entrar de novo." };
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  company: string;
  size: Org["size"];
  inviteToken?: string;
}) {
  if (!supabaseConfigured()) return { error: "Ligue o CodeCraft Gestão ao próprio projeto Supabase." };
  const supabase = getSupabase();
  const email = input.email.trim().toLowerCase();
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error) {
      const lower = error.message.toLowerCase();
      if (lower.includes("already") || lower.includes("registered") || lower.includes("exists")) {
        const login = await loginAccount(email, input.password);
        if (!login.error) {
          if (input.inviteToken) {
            const claim = await claimInvite(input.inviteToken);
            if (claim.error) return { error: claim.error };
          }
          return { error: null };
        }
        return {
          error:
            "Este e-mail já tem conta. Use Entrar com a mesma senha ou Esqueci a senha no login.",
        };
      }
      return { error: authMessage(error.message) };
    }
    if (!data.user) return { error: "Não deu para criar a conta." };
    if (!data.session) {
      const signed = await supabase.auth.signInWithPassword({ email, password: input.password });
      if (signed.error || !signed.data.session) return { error: CONFIRM_HINT };
    }
    if (input.inviteToken) {
      const { error: profileError } = await supabase.from("cc_profiles").upsert({
        id: data.user.id,
        name: input.name,
        plan: "NONE",
      });
      if (profileError) return { error: profileError.message };
      const claim = await claimInvite(input.inviteToken);
      if (claim.error) return { error: claim.error };
      bump();
      return { error: null };
    }
    const boot = await bootstrapFromAuth(input.name, input.company, input.size);
    if (boot.error || !boot.session) return { error: boot.error || "Conta criada, mas a empresa não foi salva." };
    bump();
    return { error: null };
  } catch (err) {
    return { error: authMessage(err instanceof Error ? err.message : "Falha de rede no cadastro.") };
  }
}

export async function loginAccount(email: string, password: string) {
  if (!supabaseConfigured()) return { error: "Ligue o CodeCraft Gestão ao próprio projeto Supabase." };
  try {
    const { error } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) return { error: authMessage(error.message) };
    let session = await refreshSession();
    if (!session) {
      const boot = await bootstrapFromAuth("", "");
      session = boot.session;
      if (!session) {
        return {
          error: boot.error || "Entrou no Auth, mas a empresa não carregou. Tente de novo em alguns segundos.",
        };
      }
    }
    bump();
    return { error: null };
  } catch (err) {
    return { error: authMessage(err instanceof Error ? err.message : "Falha de rede no login.") };
  }
}

export async function logoutAccount() {
  await getSupabase().auth.signOut();
  snapshot = null;
  bump();
}

function appOrigin() {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${window.location.origin}${base}`;
}

export async function requestPasswordReset(email: string) {
  if (!supabaseConfigured()) return { error: "Ligue o CodeCraft Gestão ao próprio projeto Supabase." };
  try {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${appOrigin()}/redefinir-senha/`,
    });
    if (error) return { error: authMessage(error.message) };
    return { error: null };
  } catch (err) {
    return { error: authMessage(err instanceof Error ? err.message : "Falha de rede.") };
  }
}

export async function updatePassword(password: string) {
  if (!supabaseConfigured()) return { error: "Ligue o CodeCraft Gestão ao próprio projeto Supabase." };
  if (password.length < 8) return { error: "A senha precisa ter pelo menos 8 caracteres." };
  try {
    const { error } = await getSupabase().auth.updateUser({ password });
    if (error) return { error: authMessage(error.message) };
    return { error: null };
  } catch (err) {
    return { error: authMessage(err instanceof Error ? err.message : "Falha de rede.") };
  }
}

export async function waitForRecoverySession(timeoutMs = 8000) {
  const supabase = getSupabase();
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { data } = await supabase.auth.getSession();
    if (data.session) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  const { data } = await supabase.auth.getSession();
  return Boolean(data.session);
}

async function need() {
  const session = await requireSession();
  if (!session) throw new Error("Sessão expirada.");
  return session;
}

function billingColumnError(error: { message: string; code?: string }) {
  if (error.message.toLowerCase().includes("column") || error.code === "42703") {
    throw new Error("Rode de novo o arquivo supabase/schema.sql neste projeto. Faltam as colunas da assinatura.");
  }
  throw error;
}

export async function registerCardAndSubscribe(input: {
  number: string;
  name: string;
  exp: string;
  cvv: string;
  cpf: string;
  plan: Exclude<PlanId, "NONE">;
  firstPay: "card" | "pix";
}): Promise<{
  activated: boolean;
  paymentId?: string;
  pixPayload?: string | null;
  pixImage?: string | null;
  invoiceUrl?: string | null;
  status?: string;
}> {
  const session = await need();
  const card = readCard(input);
  if ("error" in card) throw new Error(card.error);

  const provider = (process.env.NEXT_PUBLIC_BILLING_PROVIDER || "local").toLowerCase();
  if (provider === "asaas") {
    const { data: sess } = await getSupabase().auth.getSession();
    const token = sess.session?.access_token;
    if (!token) throw new Error("Sessão expirada.");
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    const res = await fetch(`${base}/functions/v1/billing-subscribe`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        plan: input.plan,
        method: input.firstPay,
        card: {
          number: input.number.replace(/\D/g, ""),
          holder: card.holder,
          exp: card.exp,
          cvv: input.cvv,
          cpf: card.cpf,
        },
      }),
    });
    const body = (await res.json().catch(() => ({}))) as {
      error?: string;
      ok?: boolean;
      activated?: boolean;
      paymentId?: string;
      pixPayload?: string | null;
      pixImage?: string | null;
      invoiceUrl?: string | null;
      status?: string;
    };
    if (!res.ok) {
      throw new Error(body.error || "Asaas não respondeu. Confira a Edge Function.");
    }
    const refreshed = await refreshSession();
    if (refreshed) Object.assign(session, refreshed);
    bump();
    return {
      activated: Boolean(body.activated),
      paymentId: body.paymentId,
      pixPayload: body.pixPayload,
      pixImage: body.pixImage,
      invoiceUrl: body.invoiceUrl,
      status: body.status,
    };
  }

  const { error } = await getSupabase().rpc("cc_subscribe", {
    p_plan: input.plan,
    p_method: input.firstPay,
    p_card_last4: card.last4,
    p_card_brand: card.brand,
    p_card_exp: card.exp,
    p_card_holder: card.holder,
    p_card_cpf: card.cpf,
  });
  if (error) billingColumnError(error);
  const refreshed = await refreshSession();
  if (refreshed) Object.assign(session, refreshed);
  bump();
  return { activated: true };
}

export async function cancelSubscription() {
  const session = await need();
  const { error } = await getSupabase().rpc("cc_cancel_subscription");
  if (error) throw error;
  const refreshed = await refreshSession();
  if (refreshed) Object.assign(session, refreshed);
  bump();
}

export type CompanyInput = {
  legalName: string;
  tradeName: string;
  cnpj: string;
  ie: string;
  phone: string;
  email: string;
  cep: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  activity: string;
  legalRep: string;
  situation: string;
  size: Org["size"];
};

export async function linkCompany(input: CompanyInput) {
  const session = await need();
  const display = input.tradeName.trim() || input.legalName.trim();
  const payload = {
    name: display || session.org.name,
    size: input.size,
    legal_name: input.legalName.trim(),
    trade_name: input.tradeName.trim(),
    cnpj: input.cnpj,
    ie: input.ie.trim(),
    phone: input.phone.trim(),
    email: input.email.trim(),
    cep: input.cep,
    street: input.street.trim(),
    number: input.number.trim(),
    district: input.district.trim(),
    city: input.city.trim(),
    state: input.state.trim().toUpperCase(),
    activity: input.activity.trim(),
    legal_rep: input.legalRep.trim(),
    situation: input.situation.trim(),
    linked_at: nowIso(),
  };
  const { error } = await getSupabase().from("cc_orgs").update(payload).eq("id", session.org.id);
  if (error) {
    if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
      throw new Error("Esse CNPJ já está ligado em outra conta do CodeCraft Gestão.");
    }
    if (error.message.toLowerCase().includes("column") || error.code === "42703") {
      throw new Error("Rode de novo o arquivo supabase/schema.sql neste projeto. Faltam as colunas da empresa.");
    }
    throw error;
  }
  session.org = {
    ...session.org,
    name: payload.name,
    size: input.size,
    legalName: payload.legal_name,
    tradeName: payload.trade_name,
    cnpj: payload.cnpj,
    ie: payload.ie,
    phone: payload.phone,
    email: payload.email,
    cep: payload.cep,
    street: payload.street,
    number: payload.number,
    district: payload.district,
    city: payload.city,
    state: payload.state,
    activity: payload.activity,
    legalRep: payload.legal_rep,
    situation: payload.situation,
    linkedAt: payload.linked_at,
  };
  bump();
}

export async function addPerson(input: Omit<Person, "id" | "orgId">) {
  const session = await need();
  if (session.people.length >= peopleLimit(session.user)) {
    throw new Error("Neste plano a equipe já está no limite. Suba o plano.");
  }
  const row: Person = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("cc_people").insert({
    id: row.id,
    org_id: row.orgId,
    name: row.name,
    email: row.email,
    document: row.document,
    department: row.department,
    role_title: row.roleTitle,
    role: row.role,
    status: row.status,
    salary: row.salary,
    benefits: row.benefits,
    started_at: row.startedAt,
  });
  if (error) throw error;
  session.people.push(row);
  bump();
  return row;
}

export async function removePerson(id: string) {
  const session = await need();
  const { error } = await getSupabase().from("cc_people").delete().eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  session.people = session.people.filter((item) => item.id !== id);
  session.punches = session.punches.filter((item) => item.personId !== id);
  bump();
}

export async function updatePerson(id: string, patch: Partial<Omit<Person, "id" | "orgId">>) {
  const session = await need();
  const person = session.people.find((p) => p.id === id);
  if (!person) throw new Error("Colaborador não encontrado.");
  const next = { ...person, ...patch };
  const { error } = await getSupabase()
    .from("cc_people")
    .update({
      name: next.name,
      email: next.email,
      document: next.document,
      department: next.department,
      role_title: next.roleTitle,
      role: next.role,
      status: next.status,
      salary: next.salary,
      benefits: next.benefits,
      started_at: next.startedAt,
    })
    .eq("id", id)
    .eq("org_id", session.org.id);
  if (error) throw error;
  Object.assign(person, next);
  bump();
  return person;
}

export async function punchClock(input: { personId: string; kind: TimePunch["kind"]; note?: string }) {
  const session = await need();
  if (!session.people.some((p) => p.id === input.personId)) throw new Error("Colaborador não encontrado.");
  const row: TimePunch = {
    id: newId(),
    orgId: session.org.id,
    personId: input.personId,
    kind: input.kind,
    at: nowIso(),
    note: input.note?.trim() || "",
  };
  const { error } = await getSupabase().from("cc_time_clock").insert({
    id: row.id,
    org_id: row.orgId,
    person_id: row.personId,
    kind: row.kind,
    at: row.at,
    note: row.note,
  });
  if (error) throw error;
  session.punches.unshift(row);
  bump();
  return row;
}

export async function addMove(input: Omit<Move, "id" | "orgId">) {
  const session = await need();
  if (!hasFinance(session.user)) throw new Error("Assine para lançar no financeiro.");
  const row: Move = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("cc_moves").insert({
    id: row.id,
    org_id: row.orgId,
    wallet_id: row.walletId,
    type: row.type,
    amount: row.amount,
    date: row.date,
    description: row.description,
    category: row.category,
    cost_center: row.costCenter,
  });
  if (error) throw error;
  session.moves.unshift(row);
  bump();
  return row;
}

export async function updateMove(id: string, patch: Partial<Omit<Move, "id" | "orgId" | "walletId">>) {
  const session = await need();
  if (!hasFinance(session.user)) throw new Error("Assine para editar o financeiro.");
  const move = session.moves.find((m) => m.id === id);
  if (!move) throw new Error("Lançamento não encontrado.");
  const next = { ...move, ...patch };
  const { error } = await getSupabase()
    .from("cc_moves")
    .update({
      type: next.type,
      amount: next.amount,
      date: next.date,
      description: next.description,
      category: next.category,
      cost_center: next.costCenter,
    })
    .eq("id", id)
    .eq("org_id", session.org.id);
  if (error) throw error;
  Object.assign(move, next);
  bump();
  return move;
}

export async function removeMove(id: string) {
  const session = await need();
  if (!hasFinance(session.user)) throw new Error("Assine para editar o financeiro.");
  const { error } = await getSupabase().from("cc_moves").delete().eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  session.moves = session.moves.filter((m) => m.id !== id);
  bump();
}

export async function addBill(input: Omit<Bill, "id" | "orgId">) {
  const session = await need();
  if (!hasFinance(session.user)) throw new Error("Assine para abrir títulos.");
  const row: Bill = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("cc_bills").insert({
    id: row.id,
    org_id: row.orgId,
    kind: row.kind,
    party: row.party,
    description: row.description,
    amount: row.amount,
    due: row.due,
    status: row.status,
  });
  if (error) throw error;
  session.bills.push(row);
  bump();
  return row;
}

export async function settleBill(id: string) {
  const session = await need();
  const bill = session.bills.find((item) => item.id === id);
  if (!bill || bill.status === "PAID") return;
  const wallet = session.wallets[0];
  if (!wallet) throw new Error("Cadastre uma conta primeiro.");
  await addMove({
    walletId: wallet.id,
    type: bill.kind === "GET" ? "IN" : "OUT",
    amount: bill.amount,
    date: today(),
    description: bill.description,
    category: bill.kind === "GET" ? "Cliente" : "Fornecedor",
    costCenter: "Geral",
  });
  const { error } = await getSupabase().from("cc_bills").update({ status: "PAID" }).eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  bill.status = "PAID";
  bump();
}

export function cashBalance(data: Snapshot) {
  const opening = data.wallets.reduce((sum, wallet) => sum + wallet.opening, 0);
  const flow = data.moves.reduce((sum, move) => sum + (move.type === "IN" ? move.amount : -move.amount), 0);
  return opening + flow;
}

export function dreSummary(data: Snapshot) {
  const revenue = data.moves.filter((m) => m.type === "IN").reduce((s, m) => s + m.amount, 0);
  const expense = data.moves.filter((m) => m.type === "OUT").reduce((s, m) => s + m.amount, 0);
  const byCategory: Record<string, { in: number; out: number }> = {};
  for (const move of data.moves) {
    const key = move.category || "Geral";
    if (!byCategory[key]) byCategory[key] = { in: 0, out: 0 };
    if (move.type === "IN") byCategory[key].in += move.amount;
    else byCategory[key].out += move.amount;
  }
  return { revenue, expense, result: revenue - expense, byCategory };
}

export function isActive(user: Profile) {
  return isSubscribed(user);
}

export async function addCostCenter(name: string) {
  const session = await need();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Informe o nome do centro de custo.");
  if (session.costCenters.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
    throw new Error("Esse centro de custo já existe.");
  }
  const row: CostCenter = { id: newId(), orgId: session.org.id, name: trimmed };
  const { error } = await getSupabase().from("cc_cost_centers").insert({
    id: row.id,
    org_id: row.orgId,
    name: row.name,
  });
  if (error) {
    if (error.message.toLowerCase().includes("relation") || error.code === "42P01") {
      throw new Error("Rode supabase/upgrade-product.sql no SQL Editor do Supabase.");
    }
    throw error;
  }
  session.costCenters.push(row);
  session.costCenters.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  bump();
  return row;
}

export async function createInvite(email: string, role: "ADMIN" | "MEMBER" = "ADMIN") {
  const session = await need();
  if (!session.isOwner) throw new Error("Só o dono da empresa pode convidar.");
  const clean = email.trim().toLowerCase();
  if (!clean.includes("@")) throw new Error("E-mail inválido.");
  const token = crypto.randomUUID().replace(/-/g, "");
  const row = {
    id: newId(),
    org_id: session.org.id,
    email: clean,
    token,
    role,
    invited_by: session.user.id,
  };
  const { data, error } = await getSupabase().from("cc_invites").insert(row).select("*").single();
  if (error) {
    if (error.message.toLowerCase().includes("relation") || error.code === "42P01") {
      throw new Error("Rode supabase/upgrade-product.sql no SQL Editor do Supabase.");
    }
    throw error;
  }
  const invite = mapInvite(data as Record<string, unknown>);
  session.invites.unshift(invite);
  bump();

  const link = inviteUrl(invite.token);
  try {
    const { data: sess } = await getSupabase().auth.getSession();
    const token = sess.session?.access_token;
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (token && base) {
      await fetch(`${base}/functions/v1/send-invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: clean,
          link,
          orgName: session.org.name,
        }),
      });
    }
  } catch {
    /* e-mail opcional — link continua válido */
  }

  return invite;
}

export async function revokeInvite(id: string) {
  const session = await need();
  if (!session.isOwner) throw new Error("Só o dono pode remover convites.");
  const { error } = await getSupabase().from("cc_invites").delete().eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  session.invites = session.invites.filter((item) => item.id !== id);
  bump();
}

export async function peekInvite(token: string) {
  const { data, error } = await getSupabase().rpc("cc_peek_invite", { p_token: token });
  if (error) return { ok: false as const, error: error.message };
  const row = data as Record<string, unknown>;
  if (!row?.ok) return { ok: false as const, error: String(row?.error || "Convite inválido") };
  return {
    ok: true as const,
    email: String(row.email),
    orgName: String(row.org_name),
    role: String(row.role),
    expiresAt: String(row.expires_at),
  };
}

export async function claimInvite(token: string) {
  const { error } = await getSupabase().rpc("cc_claim_invite", { p_token: token });
  if (error) return { error: error.message };
  await refreshSession();
  bump();
  return { error: null };
}

export function inviteUrl(token: string) {
  if (typeof window === "undefined") return "";
  const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
  return `${window.location.origin}${base}/convite/?t=${encodeURIComponent(token)}`;
}

export async function generatePayroll(competence = competenceNow()) {
  const session = await need();
  if (!hasFinance(session.user) && !session.people.length) {
    throw new Error("Cadastre colaboradores antes de gerar a folha.");
  }
  const existing = session.payrollRuns.find((r) => r.competence === competence);
  if (existing?.status === "PAID") throw new Error("Esta competência já foi paga.");
  const { fromIso, toIso } = competenceBounds(competence);
  const actives = session.people.filter((p) => p.status === "ACTIVE" && p.salary > 0);
  if (!actives.length) throw new Error("Nenhum colaborador ativo com salário.");

  const runId = existing?.id ?? newId();
  const lines = actives.map((person) => {
    const mins = workedMinutes(
      session.punches.filter((p) => p.personId === person.id),
      fromIso,
      toIso,
    );
    return {
      id: newId(),
      run_id: runId,
      org_id: session.org.id,
      person_id: person.id,
      person_name: person.name,
      salary_cents: person.salary,
      hours_minutes: mins,
    };
  });
  const total = lines.reduce((s, line) => s + line.salary_cents, 0);

  if (existing) {
    await getSupabase().from("cc_payroll_lines").delete().eq("run_id", runId);
    const { error } = await getSupabase()
      .from("cc_payroll_runs")
      .update({ total_cents: total, status: "OPEN", paid_at: null })
      .eq("id", runId);
    if (error) throw error;
  } else {
    const { error } = await getSupabase().from("cc_payroll_runs").insert({
      id: runId,
      org_id: session.org.id,
      competence,
      status: "OPEN",
      total_cents: total,
    });
    if (error) {
      if (error.message.toLowerCase().includes("relation") || error.code === "42P01") {
        throw new Error("Rode supabase/upgrade-product.sql no SQL Editor do Supabase.");
      }
      throw error;
    }
  }
  const { error: lineError } = await getSupabase().from("cc_payroll_lines").insert(lines);
  if (lineError) throw lineError;

  await refreshSession();
  bump();
  return competence;
}

export async function payPayroll(runId: string) {
  const session = await need();
  const run = session.payrollRuns.find((r) => r.id === runId);
  if (!run) throw new Error("Folha não encontrada.");
  if (run.status === "PAID") return;
  const wallet = session.wallets[0];
  if (!wallet) throw new Error("Cadastre uma conta no financeiro.");
  await addMove({
    walletId: wallet.id,
    type: "OUT",
    amount: run.totalCents,
    date: today(),
    description: `Folha ${run.competence}`,
    category: "Folha",
    costCenter: "Geral",
  });
  const { error } = await getSupabase()
    .from("cc_payroll_runs")
    .update({ status: "PAID", paid_at: nowIso() })
    .eq("id", runId)
    .eq("org_id", session.org.id);
  if (error) throw error;
  await refreshSession();
  bump();
}
