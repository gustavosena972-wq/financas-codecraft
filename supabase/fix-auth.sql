-- CodeCraft Gestão · libera contas sem e-mail de confirmação
-- SQL Editor do projeto eqaoanbanhryhbldlbhc → RUN

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;

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
  for each row
  execute function public.cc_auth_auto_confirm();
