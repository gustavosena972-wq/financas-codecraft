-- Finanças CodeCraft — banco SÓ deste produto.
-- NÃO rode isto no projeto do site (projects, messages, chat, etc).
-- Crie um projeto novo no Supabase: nome "financas-codecraft".
-- SQL Editor → cole este arquivo → RUN.

create table if not exists public.fn_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  last_org_id uuid,
  plan text not null default 'FREE',
  created_at timestamptz not null default now()
);

create table if not exists public.fn_orgs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  size text not null default 'pequena' check (size in ('mei', 'pequena', 'media', 'grande')),
  autopilot boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.fn_orgs add column if not exists legal_name text not null default '';
alter table public.fn_orgs add column if not exists trade_name text not null default '';
alter table public.fn_orgs add column if not exists cnpj text not null default '';
alter table public.fn_orgs add column if not exists ie text not null default '';
alter table public.fn_orgs add column if not exists phone text not null default '';
alter table public.fn_orgs add column if not exists email text not null default '';
alter table public.fn_orgs add column if not exists cep text not null default '';
alter table public.fn_orgs add column if not exists street text not null default '';
alter table public.fn_orgs add column if not exists number text not null default '';
alter table public.fn_orgs add column if not exists district text not null default '';
alter table public.fn_orgs add column if not exists city text not null default '';
alter table public.fn_orgs add column if not exists state text not null default '';
alter table public.fn_orgs add column if not exists activity text not null default '';
alter table public.fn_orgs add column if not exists legal_rep text not null default '';
alter table public.fn_orgs add column if not exists situation text not null default '';
alter table public.fn_orgs add column if not exists linked_at timestamptz;

create unique index if not exists fn_orgs_cnpj_uidx
  on public.fn_orgs (cnpj)
  where length(cnpj) = 14;

alter table public.fn_profiles
  drop constraint if exists fn_profiles_last_org_fk;
alter table public.fn_profiles
  add constraint fn_profiles_last_org_fk
  foreign key (last_org_id) references public.fn_orgs (id) on delete set null;

create table if not exists public.fn_people (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  name text not null,
  email text not null default '',
  department text not null default 'PESSOAS',
  role text not null default 'MEMBER',
  status text not null default 'ACTIVE',
  salary integer not null default 0,
  started_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.fn_deals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  name text not null,
  customer text not null,
  amount integer not null default 0,
  stage text not null default 'LEAD',
  owner_name text not null default '',
  due_at date,
  created_at timestamptz not null default now()
);

create table if not exists public.fn_works (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  name text not null,
  owner_name text not null default '',
  status text not null default 'PLAN',
  due_at date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.fn_tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  title text not null,
  area text not null default 'GERAL',
  status text not null default 'TODO',
  assignee text not null default '',
  auto boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.fn_wallets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  name text not null,
  kind text not null default 'BANK',
  opening integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fn_moves (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  wallet_id uuid not null references public.fn_wallets (id) on delete cascade,
  type text not null check (type in ('IN', 'OUT')),
  amount integer not null,
  date date not null default current_date,
  description text not null,
  category text not null default 'Geral',
  created_at timestamptz not null default now()
);

create table if not exists public.fn_bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  kind text not null check (kind in ('PAY', 'GET')),
  party text not null,
  description text not null,
  amount integer not null,
  due date not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table if not exists public.fn_stock (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  name text not null,
  qty integer not null default 0,
  min_qty integer not null default 0,
  unit_cost integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fn_ai_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.fn_orgs (id) on delete cascade,
  kind text not null default 'done',
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists fn_orgs_owner_idx on public.fn_orgs (owner_id);
create index if not exists fn_people_org_idx on public.fn_people (org_id);
create index if not exists fn_deals_org_idx on public.fn_deals (org_id);
create index if not exists fn_works_org_idx on public.fn_works (org_id);
create index if not exists fn_tasks_org_idx on public.fn_tasks (org_id);
create index if not exists fn_wallets_org_idx on public.fn_wallets (org_id);
create index if not exists fn_moves_org_idx on public.fn_moves (org_id);
create index if not exists fn_bills_org_idx on public.fn_bills (org_id);
create index if not exists fn_stock_org_idx on public.fn_stock (org_id);
create index if not exists fn_ai_org_idx on public.fn_ai_log (org_id, created_at desc);

create or replace function public.fn_owns_org(oid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fn_orgs
    where id = oid and owner_id = auth.uid()
  );
$$;

alter table public.fn_profiles enable row level security;
alter table public.fn_orgs enable row level security;
alter table public.fn_people enable row level security;
alter table public.fn_deals enable row level security;
alter table public.fn_works enable row level security;
alter table public.fn_tasks enable row level security;
alter table public.fn_wallets enable row level security;
alter table public.fn_moves enable row level security;
alter table public.fn_bills enable row level security;
alter table public.fn_stock enable row level security;
alter table public.fn_ai_log enable row level security;

drop policy if exists "fn_profiles_own" on public.fn_profiles;
create policy "fn_profiles_own" on public.fn_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "fn_orgs_own" on public.fn_orgs;
create policy "fn_orgs_own" on public.fn_orgs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "fn_people_own" on public.fn_people;
create policy "fn_people_own" on public.fn_people
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_deals_own" on public.fn_deals;
create policy "fn_deals_own" on public.fn_deals
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_works_own" on public.fn_works;
create policy "fn_works_own" on public.fn_works
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_tasks_own" on public.fn_tasks;
create policy "fn_tasks_own" on public.fn_tasks
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_wallets_own" on public.fn_wallets;
create policy "fn_wallets_own" on public.fn_wallets
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_moves_own" on public.fn_moves;
create policy "fn_moves_own" on public.fn_moves
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_bills_own" on public.fn_bills;
create policy "fn_bills_own" on public.fn_bills
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_stock_own" on public.fn_stock;
create policy "fn_stock_own" on public.fn_stock
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

drop policy if exists "fn_ai_own" on public.fn_ai_log;
create policy "fn_ai_own" on public.fn_ai_log
  for all using (public.fn_owns_org(org_id)) with check (public.fn_owns_org(org_id));

alter table public.fn_profiles replica identity full;
alter table public.fn_orgs replica identity full;
alter table public.fn_people replica identity full;
alter table public.fn_deals replica identity full;
alter table public.fn_works replica identity full;
alter table public.fn_tasks replica identity full;
alter table public.fn_wallets replica identity full;
alter table public.fn_moves replica identity full;
alter table public.fn_bills replica identity full;
alter table public.fn_stock replica identity full;
alter table public.fn_ai_log replica identity full;

do $$
begin
  begin execute 'alter publication supabase_realtime add table public.fn_orgs'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_people'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_deals'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_works'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_tasks'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_wallets'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_moves'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_bills'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_stock'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.fn_ai_log'; exception when duplicate_object then null; end;
end $$;
