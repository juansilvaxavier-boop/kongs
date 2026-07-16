-- is_admin() precisa ser SECURITY DEFINER: como security invoker, sua consulta
-- interna a user_roles reaplicava a RLS de user_roles (que também chama
-- is_admin()), causando recursão infinita ("stack depth limit exceeded").
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
