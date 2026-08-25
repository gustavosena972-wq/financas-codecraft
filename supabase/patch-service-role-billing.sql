-- Permite Edge Functions (service_role) atualizarem billing no webhook Asaas
create or replace function public.cc_profiles_billing_guard()
returns trigger
language plpgsql
as $$
begin
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
