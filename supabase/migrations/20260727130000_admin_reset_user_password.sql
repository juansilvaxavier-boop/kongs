-- Permite que um admin redefina a senha de qualquer usuário direto pelo
-- painel (Usuários). Não existe (nem pode existir) uma forma de ver a
-- senha já cadastrada — o Supabase só guarda o hash bcrypt, nunca o texto
-- puro — então a única ação possível é definir uma nova senha.
--
-- Grava o hash com o mesmo esquema (bcrypt, pgcrypto) que o GoTrue usa
-- internamente, e invalida as sessões ativas do usuário (refresh tokens)
-- pra forçar login com a senha nova.
create or replace function public.admin_reset_user_password(p_user_id uuid, p_new_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Sem permissão para redefinir senha de usuários.';
  end if;

  if p_new_password is null or length(p_new_password) < 6 then
    raise exception 'A nova senha deve ter pelo menos 6 caracteres.';
  end if;

  update auth.users
  set encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf', 10)),
      updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Usuário não encontrado.';
  end if;

  delete from auth.refresh_tokens where user_id = p_user_id::text;

  insert into public.audit_log (actor_user_id, action, table_name, record_id, new_data)
  values ((select auth.uid()), 'update', 'auth.users', p_user_id, jsonb_build_object('event', 'admin_password_reset'));
end;
$$;

revoke all on function public.admin_reset_user_password(uuid, text) from public;
revoke execute on function public.admin_reset_user_password(uuid, text) from anon;
grant execute on function public.admin_reset_user_password(uuid, text) to authenticated;
