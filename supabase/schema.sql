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

-- BEGIN upgrade-product (mirrored)
-- CodeCraft Gestão — upgrade produto (billing seguro, membros, folha, centros)
-- SQL Editor no projeto deste app → RUN (idempotente)

-- ========== Members + invites ==========
create table if not exists public.cc_org_members (
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null default 'ADMIN' check (role in ('OWNER', 'ADMIN', 'MEMBER')),
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index if not exists cc_org_members_user_idx on public.cc_org_members (user_id);

create table if not exists public.cc_invites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  email text not null,
  token text not null unique,
  role text not null default 'ADMIN' check (role in ('ADMIN', 'MEMBER')),
  invited_by uuid not null references auth.users (id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists cc_invites_org_idx on public.cc_invites (org_id, created_at desc);
create index if not exists cc_invites_token_idx on public.cc_invites (token);

-- Seed owners as members
insert into public.cc_org_members (org_id, user_id, role)
select id, owner_id, 'OWNER' from public.cc_orgs
on conflict do nothing;

create or replace function public.cc_owns_org(oid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.cc_orgs o
    where o.id = oid and o.owner_id = auth.uid()
  )
  or exists (
    select 1 from public.cc_org_members m
    where m.org_id = oid and m.user_id = auth.uid()
  );
$$;

alter table public.cc_org_members enable row level security;
alter table public.cc_invites enable row level security;

drop policy if exists "cc_members_own" on public.cc_org_members;
create policy "cc_members_own" on public.cc_org_members
  for select using (public.cc_owns_org(org_id) or user_id = auth.uid());

drop policy if exists "cc_members_manage" on public.cc_org_members;
create policy "cc_members_manage" on public.cc_org_members
  for all using (
    exists (
      select 1 from public.cc_orgs o
      where o.id = org_id and o.owner_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from public.cc_orgs o
      where o.id = org_id and o.owner_id = auth.uid()
    )
  );

drop policy if exists "cc_invites_own" on public.cc_invites;
create policy "cc_invites_own" on public.cc_invites
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

drop policy if exists "cc_invites_token_read" on public.cc_invites;

-- ========== Cost centers ==========
create table if not exists public.cc_cost_centers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (org_id, name)
);

create index if not exists cc_cost_centers_org_idx on public.cc_cost_centers (org_id);

alter table public.cc_cost_centers enable row level security;
drop policy if exists "cc_cost_centers_own" on public.cc_cost_centers;
create policy "cc_cost_centers_own" on public.cc_cost_centers
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

insert into public.cc_cost_centers (org_id, name)
select o.id, 'Geral' from public.cc_orgs o
where not exists (
  select 1 from public.cc_cost_centers c where c.org_id = o.id and c.name = 'Geral'
);

-- ========== Payroll ==========
create table if not exists public.cc_payroll_runs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  competence text not null,
  status text not null default 'OPEN' check (status in ('OPEN', 'PAID')),
  total_cents integer not null default 0,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (org_id, competence)
);

create table if not exists public.cc_payroll_lines (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.cc_payroll_runs (id) on delete cascade,
  org_id uuid not null references public.cc_orgs (id) on delete cascade,
  person_id uuid not null references public.cc_people (id) on delete cascade,
  person_name text not null,
  salary_cents integer not null default 0,
  hours_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists cc_payroll_runs_org_idx on public.cc_payroll_runs (org_id, competence desc);
create index if not exists cc_payroll_lines_run_idx on public.cc_payroll_lines (run_id);

alter table public.cc_payroll_runs enable row level security;
alter table public.cc_payroll_lines enable row level security;

drop policy if exists "cc_payroll_runs_own" on public.cc_payroll_runs;
create policy "cc_payroll_runs_own" on public.cc_payroll_runs
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

drop policy if exists "cc_payroll_lines_own" on public.cc_payroll_lines;
create policy "cc_payroll_lines_own" on public.cc_payroll_lines
  for all using (public.cc_owns_org(org_id)) with check (public.cc_owns_org(org_id));

-- ========== Billing guard + RPCs ==========
create or replace function public.cc_profiles_billing_guard()
returns trigger
language plpgsql
as $$
begin
  -- service_role (Edge Functions / webhooks) pode alterar billing
  if coalesce(auth.role(), '') = 'service_role' then
    return new;
  end if;
  if tg_op = 'UPDATE' and coalesce(current_setting('cc.allow_billing', true), '') <> 'on' then
    new.plan := old.plan;
    new.billing_status := old.billing_status;
    new.billing_method := old.billing_method;
    new.credit_cents := old.credit_cents;
    new.billed_at := old.billed_at;
    new.next_charge_at := old.next_charge_at;
  end if;
  return new;
end;
$$;

drop trigger if exists cc_profiles_billing_guard on public.cc_profiles;
create trigger cc_profiles_billing_guard
  before update on public.cc_profiles
  for each row execute function public.cc_profiles_billing_guard();

create or replace function public.cc_subscribe(
  p_plan text,
  p_method text,
  p_card_last4 text,
  p_card_brand text,
  p_card_exp text,
  p_card_holder text,
  p_card_cpf text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_price integer;
  v_billed timestamptz := now();
  v_next timestamptz := now() + interval '1 month';
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;
  if p_plan not in ('START', 'BUSINESS', 'CORP') then
    raise exception 'Plano inválido';
  end if;
  if p_method not in ('card', 'pix') then
    raise exception 'Método inválido';
  end if;
  if length(coalesce(p_card_last4, '')) <> 4 or length(coalesce(p_card_holder, '')) < 3 then
    raise exception 'Cartão incompleto';
  end if;

  v_price := case p_plan
    when 'START' then 28000
    when 'BUSINESS' then 39000
    when 'CORP' then 50000
  end;

  perform set_config('cc.allow_billing', 'on', true);

  update public.cc_profiles
  set
    plan = p_plan,
    billing_status = 'active',
    billing_method = p_method,
    card_last4 = p_card_last4,
    card_brand = coalesce(p_card_brand, ''),
    card_exp = coalesce(p_card_exp, ''),
    card_holder = p_card_holder,
    card_cpf = coalesce(p_card_cpf, ''),
    billed_at = v_billed,
    next_charge_at = v_next
  where id = v_uid;

  insert into public.cc_charges (id, owner_id, amount, method, status, plan, card_last4)
  values (gen_random_uuid(), v_uid, v_price, p_method, 'paid', p_plan, p_card_last4);
end;
$$;

create or replace function public.cc_cancel_subscription()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  perform set_config('cc.allow_billing', 'on', true);
  update public.cc_profiles
  set
    plan = 'NONE',
    billing_status = 'inactive',
    billing_method = '',
    next_charge_at = null
  where id = auth.uid();
end;
$$;

create or replace function public.cc_renew_if_due()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_price integer;
  v_use_credit boolean;
  v_can_card boolean;
  v_method text;
  v_credit integer;
  v_billed timestamptz := now();
  v_next timestamptz;
begin
  if auth.uid() is null then
    return null;
  end if;

  select * into r from public.cc_profiles where id = auth.uid();
  if r is null or r.plan = 'NONE' or r.next_charge_at is null then
    return null;
  end if;
  if r.next_charge_at > now() then
    return null;
  end if;

  v_price := case r.plan
    when 'START' then 28000
    when 'BUSINESS' then 39000
    when 'CORP' then 50000
    else 0
  end;

  v_can_card := length(coalesce(r.card_last4, '')) = 4 and length(coalesce(r.card_holder, '')) >= 3;
  v_use_credit := coalesce(r.credit_cents, 0) >= v_price;

  perform set_config('cc.allow_billing', 'on', true);

  if not v_can_card and not v_use_credit then
    update public.cc_profiles set billing_status = 'past_due' where id = r.id;
    return jsonb_build_object('billing_status', 'past_due');
  end if;

  v_credit := case when v_use_credit then r.credit_cents - v_price else r.credit_cents end;
  v_method := case when v_use_credit and not v_can_card then 'pix' else 'card' end;
  v_next := r.next_charge_at + interval '1 month';

  update public.cc_profiles
  set
    billed_at = v_billed,
    next_charge_at = v_next,
    billing_status = 'active',
    billing_method = v_method,
    credit_cents = v_credit
  where id = r.id;

  insert into public.cc_charges (id, owner_id, amount, method, status, plan, card_last4)
  values (gen_random_uuid(), r.id, v_price, v_method, 'paid', r.plan, coalesce(r.card_last4, ''));

  return jsonb_build_object(
    'billing_status', 'active',
    'billing_method', v_method,
    'credit_cents', v_credit,
    'billed_at', v_billed,
    'next_charge_at', v_next
  );
end;
$$;

create or replace function public.cc_peek_invite(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text;
  v_role text;
  v_expires timestamptz;
  v_claimed timestamptz;
  org_name text;
begin
  select i.email, i.role, i.expires_at, i.claimed_at, o.name
  into v_email, v_role, v_expires, v_claimed, org_name
  from public.cc_invites i
  join public.cc_orgs o on o.id = i.org_id
  where i.token = p_token;

  if v_email is null then
    return jsonb_build_object('ok', false, 'error', 'Convite inválido');
  end if;
  if v_claimed is not null then
    return jsonb_build_object('ok', false, 'error', 'Convite já usado');
  end if;
  if v_expires < now() then
    return jsonb_build_object('ok', false, 'error', 'Convite expirado');
  end if;

  return jsonb_build_object(
    'ok', true,
    'email', v_email,
    'org_name', org_name,
    'role', v_role,
    'expires_at', v_expires
  );
end;
$$;

create or replace function public.cc_claim_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inv record;
  v_uid uuid := auth.uid();
  v_name text;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select * into inv
  from public.cc_invites
  where token = p_token
  for update;

  if inv is null then
    raise exception 'Convite inválido';
  end if;
  if inv.claimed_at is not null then
    raise exception 'Convite já usado';
  end if;
  if inv.expires_at < now() then
    raise exception 'Convite expirado';
  end if;

  insert into public.cc_org_members (org_id, user_id, role)
  values (inv.org_id, v_uid, inv.role)
  on conflict (org_id, user_id) do update set role = excluded.role;

  select coalesce(nullif(name, ''), split_part(coalesce(inv.email, ''), '@', 1), 'Convidado')
  into v_name
  from public.cc_profiles
  where id = v_uid;

  insert into public.cc_profiles (id, name, last_org_id)
  values (v_uid, coalesce(v_name, split_part(inv.email, '@', 1), 'Convidado'), inv.org_id)
  on conflict (id) do update set last_org_id = excluded.last_org_id;

  update public.cc_invites set claimed_at = now() where id = inv.id;
  return inv.org_id;
end;
$$;

grant execute on function public.cc_subscribe(text, text, text, text, text, text, text) to authenticated;
grant execute on function public.cc_cancel_subscription() to authenticated;
grant execute on function public.cc_renew_if_due() to authenticated;
grant execute on function public.cc_peek_invite(text) to authenticated;
grant execute on function public.cc_claim_invite(text) to authenticated;

-- Realtime extras
do $$
begin
  begin execute 'alter publication supabase_realtime add table public.cc_cost_centers'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_payroll_runs'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_payroll_lines'; exception when duplicate_object then null; end;
  begin execute 'alter publication supabase_realtime add table public.cc_org_members'; exception when duplicate_object then null; end;
end $$;

-- END upgrade-product
