-- admin_list_users(): agora também retorna as permissões granulares
-- de cada usuário, para a tela de gestão de usuários mostrar e editar.
-- Precisa dropar antes: mudou o tipo de retorno (nova coluna permissions).
drop function if exists public.admin_list_users();

create function public.admin_list_users()
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
  role text,
  permissions text[]
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
      ur.role,
      coalesce(
        array_agg(up.permission) filter (where up.permission is not null),
        array[]::text[]
      )
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.user_roles ur on ur.user_id = u.id
    left join public.user_permissions up on up.user_id = u.id
    group by u.id, u.email, u.created_at, u.last_sign_in_at, p.first_name, p.last_name, p.persona, p.phone, p.avatar_url, ur.role
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke execute on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;
