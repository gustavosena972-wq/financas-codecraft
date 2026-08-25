-- Assinatura Asaas recorrente: IDs + anti-duplicata de cobrança
-- Rode no SQL Editor do projeto Supabase (eqaoanbanhryhbldlbhc)

alter table public.cc_profiles
  add column if not exists asaas_customer_id text not null default '',
  add column if not exists asaas_subscription_id text not null default '';

alter table public.cc_charges
  add column if not exists asaas_payment_id text;

create unique index if not exists cc_charges_asaas_payment_uidx
  on public.cc_charges (asaas_payment_id)
  where asaas_payment_id is not null and length(asaas_payment_id) > 0;

-- Com assinatura Asaas ativa, não inventa pagamento local:
-- espera o webhook. Após 3 dias de atraso → past_due.
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

  perform set_config('cc.allow_billing', 'on', true);

  -- Gateway Asaas cuida da recorrência via webhook
  if length(coalesce(r.asaas_subscription_id, '')) > 0 then
    if r.next_charge_at + interval '3 days' < now() then
      update public.cc_profiles set billing_status = 'past_due' where id = r.id;
      return jsonb_build_object('billing_status', 'past_due');
    end if;
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
    next_charge_at = null,
    asaas_subscription_id = ''
  where id = auth.uid();
end;
$$;
