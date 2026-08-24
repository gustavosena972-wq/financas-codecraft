-- CodeCraft Gestão · libera login sem e-mail de confirmação
-- Cole no SQL Editor do projeto Supabase (eqaoanbanhryhbldlbhc) e clique RUN.

-- 1) Confirma contas que já existem mas ficaram travadas
update auth.users
set
  email_confirmed_at = coalesce(email_confirmed_at, now()),
  confirmed_at = coalesce(confirmed_at, now())
where email_confirmed_at is null;

-- 2) Novos cadastros entram confirmados automaticamente
create or replace function public.cc_auth_auto_confirm()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update auth.users
  set
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    confirmed_at = coalesce(confirmed_at, now())
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists cc_auth_auto_confirm on auth.users;
create trigger cc_auth_auto_confirm
  after insert on auth.users
  for each row
  execute function public.cc_auth_auto_confirm();
