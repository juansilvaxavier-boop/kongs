-- ============================================================
-- Log de auditoria: registra automaticamente quem criou, alterou
-- ou removeu registros nas áreas sensíveis do painel admin
-- (campeonatos, times/jogos/árbitros/locais, financeiro,
-- patrocinadores, cargos e permissões de usuário).
-- ============================================================
create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('insert', 'update', 'delete')),
  table_name text not null,
  record_id uuid,
  championship_id uuid references public.championships(id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_log enable row level security;

create index if not exists idx_audit_log_created_at on public.audit_log(created_at desc);
create index if not exists idx_audit_log_championship_id on public.audit_log(championship_id);
create index if not exists idx_audit_log_table_name on public.audit_log(table_name);
create index if not exists idx_audit_log_actor_user_id on public.audit_log(actor_user_id);

-- Apenas administradores globais podem ler o log de auditoria.
create policy "audit_log_select_admin" on public.audit_log
  for select using (is_admin());

-- Nenhuma política de insert/update/delete: as linhas só entram via
-- o trigger abaixo (security definer), nunca diretamente pelo cliente.

-- ============================================================
-- Função de trigger genérica: grava uma linha em audit_log a cada
-- insert/update/delete nas tabelas monitoradas.
-- ============================================================
create or replace function public.audit_log_row()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row jsonb;
  v_record_id uuid;
  v_championship_id uuid;
begin
  if TG_OP = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_record_id := coalesce(v_row->>'id', v_row->>'user_id')::uuid;

  if TG_TABLE_NAME = 'championships' then
    v_championship_id := v_record_id;
  else
    v_championship_id := nullif(v_row->>'championship_id', '')::uuid;
  end if;

  insert into public.audit_log (
    actor_user_id, action, table_name, record_id, championship_id, old_data, new_data
  )
  values (
    auth.uid(),
    lower(TG_OP),
    TG_TABLE_NAME,
    v_record_id,
    v_championship_id,
    case when TG_OP <> 'INSERT' then to_jsonb(old) else null end,
    case when TG_OP <> 'DELETE' then to_jsonb(new) else null end
  );

  if TG_OP = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'championships', 'teams', 'coaches', 'games', 'referees', 'venues',
    'financial_entries', 'sponsors', 'user_roles', 'user_permissions'
  ]
  loop
    execute format('drop trigger if exists audit_log_trigger on public.%I;', t);
    execute format(
      'create trigger audit_log_trigger after insert or update or delete on public.%I for each row execute function public.audit_log_row();',
      t
    );
  end loop;
end;
$$;

-- ============================================================
-- admin_list_audit_log(): lista paginada e filtrável, com o nome/
-- e-mail de quem executou a ação e o nome do campeonato afetado.
-- ============================================================
create or replace function public.admin_list_audit_log(
  p_limit int default 50,
  p_offset int default 0,
  p_table_name text default null,
  p_action text default null,
  p_championship_id uuid default null
)
returns table (
  id uuid,
  created_at timestamptz,
  actor_user_id uuid,
  actor_email text,
  actor_name text,
  action text,
  table_name text,
  record_id uuid,
  championship_id uuid,
  championship_name text,
  old_data jsonb,
  new_data jsonb,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Sem permissão para visualizar o log de auditoria.';
  end if;

  return query
    select
      al.id,
      al.created_at,
      al.actor_user_id,
      u.email::text,
      nullif(trim(concat(p.first_name, ' ', p.last_name)), ''),
      al.action,
      al.table_name,
      al.record_id,
      al.championship_id,
      c.name,
      al.old_data,
      al.new_data,
      count(*) over ()
    from public.audit_log al
    left join auth.users u on u.id = al.actor_user_id
    left join public.profiles p on p.user_id = al.actor_user_id
    left join public.championships c on c.id = al.championship_id
    where (p_table_name is null or al.table_name = p_table_name)
      and (p_action is null or al.action = p_action)
      and (p_championship_id is null or al.championship_id = p_championship_id)
    order by al.created_at desc
    limit greatest(p_limit, 0)
    offset greatest(p_offset, 0);
end;
$$;

revoke all on function public.admin_list_audit_log(int, int, text, text, uuid) from public;
revoke execute on function public.admin_list_audit_log(int, int, text, text, uuid) from anon;
grant execute on function public.admin_list_audit_log(int, int, text, text, uuid) to authenticated;
