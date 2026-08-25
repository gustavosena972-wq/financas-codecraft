-- CodeCraft Gestão Empresarial
-- SaaS B2B multi-tenant · só empresas · sem IA no admin
-- SQL Editor no projeto Supabase deste app → RUN

create table if not exists public.cc_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  last_org_id uuid,
  plan text not null default 'NONE',
  billing_status text not null default 'inactive',
  billing_method text not null default '',
  card_last4 text not null default '',
  card_brand text not null default '',
  card_exp text not null default '',
  card_holder text not null default '',
  card_cpf text not null default '',
  credit_cents integer not null default 0,
  billed_at timestamptz,
  next_charge_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.cc_orgs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  size text not null default 'pequena' check (size in ('mei', 'pequena', 'media', 'grande')),
  legal_name text not null default '',
  trade_name text not null default '',
  cnpj text not null default '',
  ie text not null default '',
  phone text not null default '',
  email text not null default '',
  cep text not null default '',
  street text not null default '',
  number text not null default '',
  district text not null default '',
  city text not null default '',
  state text not null default '',
  activity text not null default '',
  legal_rep text not null default '',
  situation text not null default '',
  linked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists cc_orgs_cnpj_uidx
  on public.cc_orgs (cnpj)
  where length(cnpj) = 14;

alter table public.cc_profiles
  drop constraint if exists cc_profiles_last_org_fk;
alter table public.cc_profiles
  add constraint cc_profiles_last_org_fk
  foreign key (last_org_id) references public.cc_orgs (id) on delete set null;

create table if not exists public.cc_charges (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  amount integer not null,
  method text not null default 'card',
  status text not null default 'paid',
  plan text not null default 'BUSINESS',
  card_last4 text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.cc_people (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  name text not null,
  email text not null default '',
  document text not null default '',
  department text not null default 'OPERACOES',
  role_title text not null default '',
  role text not null default 'MEMBER',
  status text not null default 'ACTIVE',
  salary integer not null default 0,
  benefits text not null default '',
  started_at date not null default current_date,
  created_at timestamptz not null default now()
);

create table if not exists public.cc_time_clock (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  person_id uuid not null references public.cc_people (id) on delete cascade,
  kind text not null check (kind in ('IN', 'OUT', 'BREAK_START', 'BREAK_END')),
  at timestamptz not null default now(),
  note text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.cc_wallets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  name text not null,
  kind text not null default 'BANK',
  opening integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.cc_moves (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  wallet_id uuid not null references public.cc_wallets (id) on delete cascade,
  type text not null check (type in ('IN', 'OUT')),
  amount integer not null,
  date date not null default current_date,
  description text not null,
  category text not null default 'Geral',
  cost_center text not null default 'Geral',
  created_at timestamptz not null default now()
);

create table if not exists public.cc_bills (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  kind text not null check (kind in ('PAY', 'GET')),
  party text not null,
  description text not null,
  amount integer not null,
  due date not null,
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create index if not exists cc_orgs_owner_idx on public.cc_orgs (owner_id);
create index if not exists cc_people_org_idx on public.cc_people (org_id);
create index if not exists cc_clock_org_idx on public.cc_time_clock (org_id, at desc);
create index if not exists cc_wallets_org_idx on public.cc_wallets (org_id);
create index if not exists cc_moves_org_idx on public.cc_moves (org_id, date desc);
create index if not exists cc_bills_org_idx on public.cc_bills (org_id, due);
create index if not exists cc_charges_owner_idx on public.cc_charges (owner_id, created_at desc);

create or replace function public.cc_owns_org(oid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cc_orgs
    where id = oid and owner_id = auth.uid()
  );
$$;

alter table public.cc_profiles enable row level security;
alter table public.cc_orgs enable row level security;
alter table public.cc_charges enable row level security;
alter table public.cc_people enable row level security;
alter table public.cc_time_clock enable row level security;
alter table public.cc_wallets enable row level security;
alter table public.cc_moves enable row level security;
alter table public.cc_bills enable row level security;

drop policy if exists "cc_profiles_own" on public.cc_profiles;
create policy "cc_profiles_own" on public.cc_profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "cc_orgs_own" on public.cc_orgs;
create policy "cc_orgs_own" on public.cc_orgs
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "cc_charges_own" on public.cc_charges;
create policy "cc_charges_own" on public.cc_charges
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists "cc_people_own" on public.cc_people;
create policy "cc_people_own" on public.cc_people
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

drop policy if exists "cc_clock_own" on public.cc_time_clock;
create policy "cc_clock_own" on public.cc_time_clock
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

drop policy if exists "cc_wallets_own" on public.cc_wallets;
create policy "cc_wallets_own" on public.cc_wallets
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

drop policy if exists "cc_moves_own" on public.cc_moves;
create policy "cc_moves_own" on public.cc_moves
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

drop policy if exists "cc_bills_own" on public.cc_bills;
create policy "cc_bills_own" on public.cc_bills
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

alter table public.cc_profiles replica identity full;
alter table public.cc_orgs replica identity full;
alter table public.cc_people replica identity full;
alter table public.cc_time_clock replica identity full;
alter table public.cc_wallets replica identity full;
alter table public.cc_moves replica identity full;
alter table public.cc_bills replica identity full;

do $$
begin
  begin execute 'alter publication supabase_realtime add table public.cc_orgs'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_people'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_time_clock'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_wallets'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_moves'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_bills'; exception when duplicate_object then null; end;
end $$;

-- Confirma e-mail no cadastro (sem desligar Confirm email no painel Auth).
-- Ver também supabase/fix-auth.sql para rodar isolado.
create or replace function public.cc_auth_auto_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set email_confirmed_at = coalesce(email_confirmed_at, now())
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists cc_auth_auto_confirm on auth.users;
create trigger cc_auth_auto_confirm
  after insert on auth.users
  for each row execute function public.cc_auth_auto_confirm();

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

-- Features extras (billing RPC, membros, folha, centros): rode também
-- supabase/upgrade-product.sql no SQL Editor (idempotente).
