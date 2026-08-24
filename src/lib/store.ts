import type {
  Bill,
  Move,
  Org,
  Person,
  PlanId,
  Profile,
  TimePunch,
  Wallet,
} from "./types";
import { newId, nowIso, today } from "./types";
import { getSupabase, supabaseConfigured } from "./supabase";
import { hasFinance, isSubscribed, parsePlan, peopleLimit, planPriceCents } from "./plans";
import { expiryValid, readCard } from "./card";

export type Snapshot = {
  user: Profile;
  org: Org;
  people: Person[];
  punches: TimePunch[];
  wallets: Wallet[];
  moves: Move[];
  bills: Bill[];
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
  const [{ data: profile }, { data: orgs }] = await Promise.all([
    supabase.from("cc_profiles").select("*").eq("id", auth.id).maybeSingle(),
    supabase.from("cc_orgs").select("*").eq("owner_id", auth.id).order("created_at"),
  ]);
  const orgRow = (orgs ?? [])[0];
  if (!orgRow) {
    snapshot = null;
    return null;
  }
  const org = mapOrg(orgRow as Record<string, unknown>);
  const [people, punches, wallets, moves, bills] = await Promise.all([
    supabase.from("cc_people").select("*").eq("org_id", org.id).order("created_at"),
    supabase.from("cc_time_clock").select("*").eq("org_id", org.id).order("at", { ascending: false }).limit(200),
    supabase.from("cc_wallets").select("*").eq("org_id", org.id).order("created_at"),
    supabase.from("cc_moves").select("*").eq("org_id", org.id).order("date", { ascending: false }),
    supabase.from("cc_bills").select("*").eq("org_id", org.id).order("due"),
  ]);

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
    people: (people.data ?? []).map((row) => mapPerson(row as Record<string, unknown>)),
    punches: (punches.data ?? []).map((row) => mapPunch(row as Record<string, unknown>)),
    wallets: (wallets.data ?? []).map((row) => mapWallet(row as Record<string, unknown>)),
    moves: (moves.data ?? []).map((row) => mapMove(row as Record<string, unknown>)),
    bills: (bills.data ?? []).map((row) => mapBill(row as Record<string, unknown>)),
  };
  return snapshot;
}

function addMonth(from: Date) {
  const next = new Date(from);
  next.setMonth(next.getMonth() + 1);
  return next;
}

async function renewIfDue(user: Profile) {
  if (user.plan === "NONE" || !user.nextChargeAt) return user;
  const due = new Date(user.nextChargeAt);
  if (Number.isNaN(due.getTime()) || due > new Date()) return user;
  const price = planPriceCents(user.plan);
  const canCard = user.cardLast4.length === 4 && user.cardHolder.length >= 3 && expiryValid(user.cardExp);
  const useCredit = user.creditCents >= price;
  if (!canCard && !useCredit) {
    const { error } = await getSupabase()
      .from("cc_profiles")
      .update({ billing_status: "past_due" })
      .eq("id", user.id);
    if (error) return user;
    return { ...user, billingStatus: "past_due" as const };
  }
  const billedAt = nowIso();
  const nextChargeAt = addMonth(due).toISOString();
  const creditLeft = useCredit ? user.creditCents - price : user.creditCents;
  const method = useCredit && !canCard ? "pix" : "card";
  const { error } = await getSupabase()
    .from("cc_profiles")
    .update({
      billed_at: billedAt,
      next_charge_at: nextChargeAt,
      billing_status: "active",
      billing_method: method,
      credit_cents: creditLeft,
      plan: user.plan,
    })
    .eq("id", user.id);
  if (error) return user;
  await getSupabase().from("cc_charges").insert({
    id: newId(),
    owner_id: user.id,
    amount: price,
    method,
    status: "paid",
    plan: user.plan,
    card_last4: user.cardLast4,
  });
  return {
    ...user,
    billedAt,
    nextChargeAt,
    billingStatus: "active" as const,
    billingMethod: method as "card" | "pix",
    creditCents: creditLeft,
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
  if (lower.includes("already")) return "Já existe uma conta com este e-mail.";
  if (lower.includes("confirm")) {
    return "No Supabase do CodeCraft Gestão, desligue Confirm email em Authentication → Providers → Email.";
  }
  return message;
}

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  company: string;
  size: Org["size"];
}) {
  if (!supabaseConfigured()) return { error: "Ligue o CodeCraft Gestão ao próprio projeto Supabase." };
  const supabase = getSupabase();
  try {
    const { data, error } = await supabase.auth.signUp({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      options: { data: { name: input.name } },
    });
    if (error || !data.user) return { error: authMessage(error?.message) };
    if (!data.session) {
      return {
        error:
          "Conta criada, mas o e-mail precisa de confirmação. No Supabase: Authentication → Providers → Email → desligue Confirm email.",
      };
    }
    const orgId = newId();
    const walletId = newId();
    const personId = newId();
    const { error: profileError } = await supabase.from("cc_profiles").insert({
      id: data.user.id,
      name: input.name,
      last_org_id: orgId,
      plan: "NONE",
    });
    if (profileError) {
      return {
        error: profileError.message.toLowerCase().includes("relation")
          ? "Faltam as tabelas. Rode supabase/schema.sql no SQL Editor deste projeto Supabase."
          : profileError.message,
      };
    }
    const { error: orgError } = await supabase.from("cc_orgs").insert({
      id: orgId,
      owner_id: data.user.id,
      name: input.company,
      size: input.size,
    });
    if (orgError) return { error: orgError.message };
    await supabase.from("cc_people").insert({
      id: personId,
      org_id: orgId,
      name: input.name,
      email: input.email.trim().toLowerCase(),
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
    await refreshSession();
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
    const session = await refreshSession();
    if (!session) {
      return {
        error:
          "Login ok no Auth, mas a empresa não carregou. Rode o arquivo supabase/schema.sql neste projeto Supabase e cadastre de novo.",
      };
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
}) {
  const session = await need();
  const card = readCard(input);
  if ("error" in card) throw new Error(card.error);
  const price = planPriceCents(input.plan);
  const billedAt = nowIso();
  const nextChargeAt = addMonth(new Date()).toISOString();
  const payload = {
    plan: input.plan,
    billing_status: "active",
    billing_method: input.firstPay,
    card_last4: card.last4,
    card_brand: card.brand,
    card_exp: card.exp,
    card_holder: card.holder,
    card_cpf: card.cpf,
    billed_at: billedAt,
    next_charge_at: nextChargeAt,
  };
  const { error } = await getSupabase().from("cc_profiles").update(payload).eq("id", session.user.id);
  if (error) billingColumnError(error);
  await getSupabase().from("cc_charges").insert({
    id: newId(),
    owner_id: session.user.id,
    amount: price,
    method: input.firstPay,
    status: "paid",
    plan: input.plan,
    card_last4: card.last4,
  });
  session.user = {
    ...session.user,
    plan: input.plan,
    billingStatus: "active",
    billingMethod: input.firstPay,
    cardLast4: card.last4,
    cardBrand: card.brand,
    cardExp: card.exp,
    cardHolder: card.holder,
    cardCpf: card.cpf,
    billedAt,
    nextChargeAt,
  };
  bump();
}

export async function cancelSubscription() {
  const session = await need();
  const { error } = await getSupabase()
    .from("cc_profiles")
    .update({
      plan: "NONE",
      billing_status: "inactive",
      billing_method: "",
      next_charge_at: null,
    })
    .eq("id", session.user.id);
  if (error) throw error;
  session.user.plan = "NONE";
  session.user.billingStatus = "inactive";
  session.user.billingMethod = "";
  session.user.nextChargeAt = null;
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
  return { revenue, expense, result: revenue - expense };
}

export function isActive(user: Profile) {
  return isSubscribed(user);
}
