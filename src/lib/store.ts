import type {
  AiLog,
  Bill,
  Deal,
  Move,
  Org,
  Person,
  PlanId,
  Profile,
  StockItem,
  Task,
  Wallet,
  Work,
} from "./types";
import { newId, nowIso, today } from "./types";
import { getSupabase, supabaseConfigured } from "./supabase";
import { hasCash, peopleLimit } from "./plans";

export type Snapshot = {
  user: Profile;
  org: Org;
  people: Person[];
  deals: Deal[];
  works: Work[];
  tasks: Task[];
  wallets: Wallet[];
  moves: Move[];
  bills: Bill[];
  stock: StockItem[];
  logs: AiLog[];
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

function parsePlan(value: unknown): PlanId {
  if (value === "TEAM" || value === "BUSINESS" || value === "ENTERPRISE") return value;
  return "FREE";
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
    autopilot: row.autopilot !== false,
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
    department: (row.department as Person["department"]) || "PESSOAS",
    role: (row.role as Person["role"]) || "MEMBER",
    status: (row.status as Person["status"]) || "ACTIVE",
    salary: Number(row.salary ?? 0),
    startedAt: String(row.started_at ?? today()),
  };
}

function mapDeal(row: Record<string, unknown>): Deal {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
    customer: String(row.customer),
    amount: Number(row.amount ?? 0),
    stage: (row.stage as Deal["stage"]) || "LEAD",
    ownerName: String(row.owner_name ?? ""),
    dueAt: String(row.due_at ?? ""),
    createdAt: String(row.created_at ?? nowIso()),
  };
}

function mapWork(row: Record<string, unknown>): Work {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
    ownerName: String(row.owner_name ?? ""),
    status: (row.status as Work["status"]) || "PLAN",
    dueAt: String(row.due_at ?? ""),
    notes: String(row.notes ?? ""),
  };
}

function mapTask(row: Record<string, unknown>): Task {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    title: String(row.title),
    area: String(row.area ?? "GERAL"),
    status: (row.status as Task["status"]) || "TODO",
    assignee: String(row.assignee ?? ""),
    auto: Boolean(row.auto),
    createdAt: String(row.created_at ?? nowIso()),
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

function mapStock(row: Record<string, unknown>): StockItem {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    name: String(row.name),
    qty: Number(row.qty ?? 0),
    minQty: Number(row.min_qty ?? 0),
    unitCost: Number(row.unit_cost ?? 0),
  };
}

function mapLog(row: Record<string, unknown>): AiLog {
  return {
    id: String(row.id),
    orgId: String(row.org_id),
    kind: (row.kind as AiLog["kind"]) || "done",
    title: String(row.title),
    body: String(row.body),
    createdAt: String(row.created_at ?? nowIso()),
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
    supabase.from("fn_profiles").select("*").eq("id", auth.id).maybeSingle(),
    supabase.from("fn_orgs").select("*").eq("owner_id", auth.id).order("created_at"),
  ]);
  const orgRow = (orgs ?? [])[0];
  if (!orgRow) {
    snapshot = null;
    return null;
  }
  const org = mapOrg(orgRow as Record<string, unknown>);
  const [
    people,
    deals,
    works,
    tasks,
    wallets,
    moves,
    bills,
    stock,
    logs,
  ] = await Promise.all([
    supabase.from("fn_people").select("*").eq("org_id", org.id).order("created_at"),
    supabase.from("fn_deals").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("fn_works").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("fn_tasks").select("*").eq("org_id", org.id).order("created_at", { ascending: false }),
    supabase.from("fn_wallets").select("*").eq("org_id", org.id).order("created_at"),
    supabase.from("fn_moves").select("*").eq("org_id", org.id).order("date", { ascending: false }),
    supabase.from("fn_bills").select("*").eq("org_id", org.id).order("due"),
    supabase.from("fn_stock").select("*").eq("org_id", org.id).order("name"),
    supabase.from("fn_ai_log").select("*").eq("org_id", org.id).order("created_at", { ascending: false }).limit(40),
  ]);
  snapshot = {
    user: {
      id: auth.id,
      email: auth.email ?? "",
      name: (profile?.name as string) || (auth.user_metadata?.name as string) || "Você",
      lastOrgId: (profile?.last_org_id as string) ?? org.id,
      plan: parsePlan(profile?.plan ?? auth.user_metadata?.plan),
      createdAt: auth.created_at,
    },
    org,
    people: (people.data ?? []).map((row) => mapPerson(row as Record<string, unknown>)),
    deals: (deals.data ?? []).map((row) => mapDeal(row as Record<string, unknown>)),
    works: (works.data ?? []).map((row) => mapWork(row as Record<string, unknown>)),
    tasks: (tasks.data ?? []).map((row) => mapTask(row as Record<string, unknown>)),
    wallets: (wallets.data ?? []).map((row) => mapWallet(row as Record<string, unknown>)),
    moves: (moves.data ?? []).map((row) => mapMove(row as Record<string, unknown>)),
    bills: (bills.data ?? []).map((row) => mapBill(row as Record<string, unknown>)),
    stock: (stock.data ?? []).map((row) => mapStock(row as Record<string, unknown>)),
    logs: (logs.data ?? []).map((row) => mapLog(row as Record<string, unknown>)),
  };
  return snapshot;
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

export async function registerAccount(input: {
  name: string;
  email: string;
  password: string;
  company: string;
  size: Org["size"];
}) {
  if (!supabaseConfigured()) return { error: "Ligue o Finanças CodeCraft ao próprio projeto Supabase." };
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { data: { name: input.name } },
  });
  if (error || !data.user) return { error: authMessage(error?.message) };
  const orgId = newId();
  const walletId = newId();
  const personId = newId();
  const { error: profileError } = await supabase.from("fn_profiles").insert({
    id: data.user.id,
    name: input.name,
    last_org_id: orgId,
    plan: "FREE",
  });
  if (profileError) return { error: profileError.message };
  const { error: orgError } = await supabase.from("fn_orgs").insert({
    id: orgId,
    owner_id: data.user.id,
    name: input.company,
    size: input.size,
    autopilot: true,
  });
  if (orgError) return { error: orgError.message };
  await supabase.from("fn_people").insert({
    id: personId,
    org_id: orgId,
    name: input.name,
    email: input.email,
    department: "DIRECAO",
    role: "ADMIN",
    status: "ACTIVE",
    salary: 0,
    started_at: today(),
  });
  await supabase.from("fn_wallets").insert({
    id: walletId,
    org_id: orgId,
    name: "Conta PJ",
    kind: "BANK",
    opening: 0,
  });
  await refreshSession();
  bump();
  return { error: null };
}

export async function loginAccount(email: string, password: string) {
  if (!supabaseConfigured()) return { error: "Ligue o Finanças CodeCraft ao próprio projeto Supabase." };
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authMessage(error.message) };
  await refreshSession();
  bump();
  return { error: null };
}

export async function logoutAccount() {
  stopLiveSync();
  if (supabaseConfigured()) await getSupabase().auth.signOut();
  snapshot = null;
  bump();
}

function authMessage(message?: string) {
  if (!message) return "Não foi possível entrar.";
  if (message.includes("Invalid login")) return "E-mail ou senha incorretos.";
  if (message.includes("already registered") || message.includes("already been registered")) {
    return "Já existe uma conta com este e-mail.";
  }
  if (message.toLowerCase().includes("confirm")) {
    return "No Supabase do Finanças CodeCraft, desligue Confirm email em Authentication → Providers → Email.";
  }
  return message;
}

async function need() {
  const session = await requireSession();
  if (!session) throw new Error("Sessão expirada.");
  return session;
}

export async function addPerson(input: Omit<Person, "id" | "orgId">) {
  const session = await need();
  if (session.people.length >= peopleLimit(session.user.plan)) {
    throw new Error("Neste plano a equipe já está no limite. Suba o plano.");
  }
  const row: Person = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("fn_people").insert({
    id: row.id,
    org_id: row.orgId,
    name: row.name,
    email: row.email,
    department: row.department,
    role: row.role,
    status: row.status,
    salary: row.salary,
    started_at: row.startedAt,
  });
  if (error) throw error;
  session.people.push(row);
  bump();
  return row;
}

export async function removePerson(id: string) {
  const session = await need();
  const { error } = await getSupabase().from("fn_people").delete().eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  session.people = session.people.filter((item) => item.id !== id);
  bump();
}

export async function addDeal(input: Omit<Deal, "id" | "orgId" | "createdAt">) {
  const session = await need();
  const row: Deal = { ...input, id: newId(), orgId: session.org.id, createdAt: nowIso() };
  const { error } = await getSupabase().from("fn_deals").insert({
    id: row.id,
    org_id: row.orgId,
    name: row.name,
    customer: row.customer,
    amount: row.amount,
    stage: row.stage,
    owner_name: row.ownerName,
    due_at: row.dueAt || null,
  });
  if (error) throw error;
  session.deals.unshift(row);
  bump();
  return row;
}

export async function setDealStage(id: string, stage: Deal["stage"]) {
  const session = await need();
  const { error } = await getSupabase().from("fn_deals").update({ stage }).eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  const deal = session.deals.find((item) => item.id === id);
  if (deal) deal.stage = stage;
  bump();
}

export async function removeDeal(id: string) {
  const session = await need();
  const { error } = await getSupabase().from("fn_deals").delete().eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  session.deals = session.deals.filter((item) => item.id !== id);
  bump();
}

export async function addWork(input: Omit<Work, "id" | "orgId">) {
  const session = await need();
  const row: Work = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("fn_works").insert({
    id: row.id,
    org_id: row.orgId,
    name: row.name,
    owner_name: row.ownerName,
    status: row.status,
    due_at: row.dueAt || null,
    notes: row.notes,
  });
  if (error) throw error;
  session.works.unshift(row);
  bump();
  return row;
}

export async function setWorkStatus(id: string, status: Work["status"]) {
  const session = await need();
  const { error } = await getSupabase().from("fn_works").update({ status }).eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  const work = session.works.find((item) => item.id === id);
  if (work) work.status = status;
  bump();
}

export async function addTask(input: Omit<Task, "id" | "orgId" | "createdAt">) {
  const session = await need();
  const row: Task = { ...input, id: newId(), orgId: session.org.id, createdAt: nowIso() };
  const { error } = await getSupabase().from("fn_tasks").insert({
    id: row.id,
    org_id: row.orgId,
    title: row.title,
    area: row.area,
    status: row.status,
    assignee: row.assignee,
    auto: row.auto,
  });
  if (error) throw error;
  session.tasks.unshift(row);
  bump();
  return row;
}

export async function setTaskStatus(id: string, status: Task["status"]) {
  const session = await need();
  const { error } = await getSupabase().from("fn_tasks").update({ status }).eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  const task = session.tasks.find((item) => item.id === id);
  if (task) task.status = status;
  bump();
}

export async function addMove(input: Omit<Move, "id" | "orgId">) {
  const session = await need();
  if (!hasCash(session.user.plan)) throw new Error("Caixa entra no plano Empresa.");
  const row: Move = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("fn_moves").insert({
    id: row.id,
    org_id: row.orgId,
    wallet_id: row.walletId,
    type: row.type,
    amount: row.amount,
    date: row.date,
    description: row.description,
    category: row.category,
  });
  if (error) throw error;
  session.moves.unshift(row);
  bump();
  return row;
}

export async function addBill(input: Omit<Bill, "id" | "orgId">) {
  const session = await need();
  if (!hasCash(session.user.plan)) throw new Error("Títulos entram no plano Empresa.");
  const row: Bill = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("fn_bills").insert({
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
  });
  const { error } = await getSupabase().from("fn_bills").update({ status: "PAID" }).eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  bill.status = "PAID";
  bump();
}

export async function addStock(input: Omit<StockItem, "id" | "orgId">) {
  const session = await need();
  const row: StockItem = { ...input, id: newId(), orgId: session.org.id };
  const { error } = await getSupabase().from("fn_stock").insert({
    id: row.id,
    org_id: row.orgId,
    name: row.name,
    qty: row.qty,
    min_qty: row.minQty,
    unit_cost: row.unitCost,
  });
  if (error) throw error;
  session.stock.push(row);
  bump();
  return row;
}

export async function bumpStock(id: string, delta: number) {
  const session = await need();
  const item = session.stock.find((row) => row.id === id);
  if (!item) return;
  const qty = Math.max(0, item.qty + delta);
  const { error } = await getSupabase().from("fn_stock").update({ qty }).eq("id", id).eq("org_id", session.org.id);
  if (error) throw error;
  item.qty = qty;
  bump();
}

export async function addAiLog(input: Omit<AiLog, "id" | "orgId" | "createdAt">) {
  const session = await need();
  const row: AiLog = { ...input, id: newId(), orgId: session.org.id, createdAt: nowIso() };
  const { error } = await getSupabase().from("fn_ai_log").insert({
    id: row.id,
    org_id: row.orgId,
    kind: row.kind,
    title: row.title,
    body: row.body,
  });
  if (error) throw error;
  session.logs.unshift(row);
  bump();
  return row;
}

export async function setPlan(plan: PlanId) {
  const session = await need();
  const { error } = await getSupabase().from("fn_profiles").update({ plan }).eq("id", session.user.id);
  if (error) throw error;
  session.user.plan = plan;
  bump();
}

export async function setAutopilot(on: boolean) {
  const session = await need();
  const { error } = await getSupabase().from("fn_orgs").update({ autopilot: on }).eq("id", session.org.id);
  if (error) throw error;
  session.org.autopilot = on;
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
  const { error } = await getSupabase().from("fn_orgs").update(payload).eq("id", session.org.id);
  if (error) {
    if (error.message.toLowerCase().includes("duplicate") || error.code === "23505") {
      throw new Error("Esse CNPJ já está ligado em outra conta do Finanças CodeCraft.");
    }
    if (error.message.toLowerCase().includes("column") || error.code === "42703") {
      throw new Error("Rode de novo o arquivo supabase/schema.sql no projeto deste app. Faltam as colunas da empresa.");
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

export function cashBalance(data: Snapshot) {
  const opening = data.wallets.reduce((sum, wallet) => sum + wallet.opening, 0);
  const flow = data.moves.reduce((sum, move) => sum + (move.type === "IN" ? move.amount : -move.amount), 0);
  return opening + flow;
}

export function pipelineValue(data: Snapshot) {
  return data.deals.filter((deal) => deal.stage === "LEAD" || deal.stage === "PROPOSAL").reduce((sum, deal) => sum + deal.amount, 0);
}
