-- ============================================================
-- admin_list_users(): permite que o admin visualize todos os
-- usuários cadastrados (auth.users não é consultável direto pelo
-- client), com dados de perfil e role, para gestão de usuários.
-- ============================================================
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  first_name text,
  last_name text,
  persona text,
  phone text,
  avatar_url text,
  role text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Sem permissão para listar usuários.';
  end if;

  return query
    select
      u.id,
      u.email::text,
      u.created_at,
      u.last_sign_in_at,
      p.first_name,
      p.last_name,
      p.persona,
      p.phone,
      p.avatar_url,
      ur.role
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.user_roles ur on ur.user_id = u.id
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;
