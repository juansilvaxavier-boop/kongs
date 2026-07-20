-- ============================================================
-- Cargos customizados: um admin pode criar um "cargo" nomeado que
-- agrupa uma combinação livre das 4 permissões existentes, e depois
-- aplicar esse cargo a um usuário de uma vez só, em vez de marcar
-- cada checkbox manualmente. Aplicar um cargo SUBSTITUI as
-- permissões atuais do usuário pelas do cargo (não faz merge).
-- ============================================================
create table if not exists public.custom_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permissions text[] not null,
  created_at timestamptz not null default now(),
  constraint custom_roles_permissions_valid check (
    permissions <@ array['manage_championships', 'manage_teams_games', 'manage_finance', 'manage_sponsors']::text[]
    and array_length(permissions, 1) > 0
  )
);

alter table public.custom_roles enable row level security;

create policy "custom_roles_select_admin" on public.custom_roles
  for select using (is_admin());

create policy "custom_roles_insert_admin" on public.custom_roles
  for insert with check (is_admin());

create policy "custom_roles_update_admin" on public.custom_roles
  for update using (is_admin()) with check (is_admin());

create policy "custom_roles_delete_admin" on public.custom_roles
  for delete using (is_admin());

create or replace function public.admin_apply_custom_role(p_user_id uuid, p_role_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permissions text[];
  v_all_permissions text[] := array['manage_championships', 'manage_teams_games', 'manage_finance', 'manage_sponsors'];
  v_permission text;
begin
  if not is_admin() then
    raise exception 'Sem permissão para aplicar cargos.';
  end if;

  select permissions into v_permissions from public.custom_roles where id = p_role_id;
  if v_permissions is null then
    raise exception 'Cargo não encontrado.';
  end if;

  foreach v_permission in array v_all_permissions loop
    if v_permission = any(v_permissions) then
      insert into public.user_permissions (user_id, permission)
      values (p_user_id, v_permission)
      on conflict (user_id, permission) do nothing;
    else
      delete from public.user_permissions
      where user_id = p_user_id and permission = v_permission;
    end if;
  end loop;
end;
$$;

revoke all on function public.admin_apply_custom_role(uuid, uuid) from public;
revoke execute on function public.admin_apply_custom_role(uuid, uuid) from anon;
grant execute on function public.admin_apply_custom_role(uuid, uuid) to authenticated;
