-- admin_list_users() agora também retorna email_confirmed_at, pra tela
-- de Usuários mostrar quem ainda não confirmou o cadastro e oferecer a
-- opção de confirmar manualmente (útil quando o e-mail de confirmação
-- não chegou por algum problema de envio).
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
  permissions text[],
  email_confirmed_at timestamptz
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
      ),
      u.email_confirmed_at
    from auth.users u
    left join public.profiles p on p.user_id = u.id
    left join public.user_roles ur on ur.user_id = u.id
    left join public.user_permissions up on up.user_id = u.id
    group by u.id, u.email, u.created_at, u.last_sign_in_at, p.first_name, p.last_name, p.persona, p.phone, p.avatar_url, ur.role, u.email_confirmed_at
    order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_users() from public;
revoke execute on function public.admin_list_users() from anon;
grant execute on function public.admin_list_users() to authenticated;

-- Confirma manualmente o e-mail de um usuário (marca email_confirmed_at),
-- pra destravar o login de quem se cadastrou mas não recebeu (ou não achou)
-- o e-mail de confirmação. confirmed_at é coluna gerada a partir dessa,
-- não precisa (e não pode) ser setada à mão.
create or replace function public.admin_confirm_user_email(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Sem permissão para confirmar e-mail de usuários.';
  end if;

  update auth.users
  set email_confirmed_at = now(),
      updated_at = now()
  where id = p_user_id and email_confirmed_at is null;

  if not found then
    if not exists (select 1 from auth.users where id = p_user_id) then
      raise exception 'Usuário não encontrado.';
    end if;
    -- Já estava confirmado: não é erro, apenas não há o que fazer.
    return;
  end if;

  insert into public.audit_log (actor_user_id, action, table_name, record_id, new_data)
  values ((select auth.uid()), 'update', 'auth.users', p_user_id, jsonb_build_object('event', 'admin_email_confirmed'));
end;
$$;

revoke all on function public.admin_confirm_user_email(uuid) from public;
revoke execute on function public.admin_confirm_user_email(uuid) from anon;
grant execute on function public.admin_confirm_user_email(uuid) to authenticated;
