-- Banco isolado do Finanças CodeCraft.
-- Não usa as tabelas do site da empresa (projects, messages, chat, etc).
-- Rode este arquivo num PROJETO SUPABASE NOVO, só deste app.

create table if not exists public.fc_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  last_workspace_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.fc_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  type text not null check (type in ('PERSONAL', 'BUSINESS')),
  created_at timestamptz not null default now()
);

create table if not exists public.fc_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.fc_workspaces (id) on delete cascade,
  name text not null,
  type text not null check (type in ('CHECKING', 'SAVINGS', 'WALLET', 'CASH', 'CREDIT')),
  initial_balance integer not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fc_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.fc_workspaces (id) on delete cascade,
  name text not null,
  kind text not null,
  color text not null
);

create table if not exists public.fc_transactions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.fc_workspaces (id) on delete cascade,
  account_id uuid not null references public.fc_accounts (id) on delete cascade,
  category_id uuid references public.fc_categories (id) on delete set null,
  type text not null check (type in ('INCOME', 'EXPENSE', 'TRANSFER')),
  amount integer not null,
  date timestamptz not null,
  description text not null,
  notes text,
  transfer_to_account_id uuid references public.fc_accounts (id) on delete set null,
  import_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.fc_budgets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.fc_workspaces (id) on delete cascade,
  category_id uuid not null references public.fc_categories (id) on delete cascade,
  month text not null,
  amount integer not null,
  unique (workspace_id, category_id, month)
);

create table if not exists public.fc_audit_logs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references public.fc_workspaces (id) on delete set null,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  entity text not null,
  entity_id text,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.fc_profiles
  add constraint fc_profiles_last_workspace_fk
  foreign key (last_workspace_id) references public.fc_workspaces (id) on delete set null;

create index if not exists fc_workspaces_owner_idx on public.fc_workspaces (owner_id);
create index if not exists fc_accounts_ws_idx on public.fc_accounts (workspace_id);
create index if not exists fc_categories_ws_idx on public.fc_categories (workspace_id);
create index if not exists fc_transactions_ws_idx on public.fc_transactions (workspace_id);
create index if not exists fc_budgets_ws_idx on public.fc_budgets (workspace_id, month);
create index if not exists fc_audit_user_idx on public.fc_audit_logs (user_id, created_at desc);

alter table public.fc_profiles enable row level security;
alter table public.fc_workspaces enable row level security;
alter table public.fc_accounts enable row level security;
alter table public.fc_categories enable row level security;
alter table public.fc_budgets enable row level security;
alter table public.fc_transactions enable row level security;
alter table public.fc_audit_logs enable row level security;

create or replace function public.fc_owns_workspace(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fc_workspaces
    where id = ws and owner_id = auth.uid()
  );
$$;

drop policy if exists "fc_profiles_own" on public.fc_profiles;
create policy "fc_profiles_own" on public.fc_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "fc_workspaces_own" on public.fc_workspaces;
create policy "fc_workspaces_own" on public.fc_workspaces
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "fc_accounts_own" on public.fc_accounts;
create policy "fc_accounts_own" on public.fc_accounts
  for all using (public.fc_owns_workspace(workspace_id))
  with check (public.fc_owns_workspace(workspace_id));

drop policy if exists "fc_categories_own" on public.fc_categories;
create policy "fc_categories_own" on public.fc_categories
  for all using (public.fc_owns_workspace(workspace_id))
  with check (public.fc_owns_workspace(workspace_id));

drop policy if exists "fc_transactions_own" on public.fc_transactions;
create policy "fc_transactions_own" on public.fc_transactions
  for all using (public.fc_owns_workspace(workspace_id))
  with check (public.fc_owns_workspace(workspace_id));

drop policy if exists "fc_budgets_own" on public.fc_budgets;
create policy "fc_budgets_own" on public.fc_budgets
  for all using (public.fc_owns_workspace(workspace_id))
  with check (public.fc_owns_workspace(workspace_id));

drop policy if exists "fc_audit_own" on public.fc_audit_logs;
create policy "fc_audit_own" on public.fc_audit_logs
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
