-- ============================================================
-- Métricas de patrocínio: registra visualizações e cliques nos
-- logos exibidos publicamente, e expõe agregados só para o admin.
-- ============================================================
create table if not exists public.sponsor_events (
  id uuid primary key default gen_random_uuid(),
  sponsor_id uuid not null references public.sponsors(id) on delete cascade,
  event_type text not null check (event_type in ('view', 'click')),
  created_at timestamptz not null default now()
);

create index if not exists idx_sponsor_events_sponsor on public.sponsor_events(sponsor_id);

alter table public.sponsor_events enable row level security;
-- Sem policies: acesso só via as funções abaixo (SECURITY DEFINER).

create or replace function public.track_sponsor_event(p_sponsor_id uuid, p_event_type text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('view', 'click') then
    raise exception 'Tipo de evento inválido.';
  end if;
  if not exists (select 1 from public.sponsors s where s.id = p_sponsor_id) then
    return;
  end if;

  insert into public.sponsor_events (sponsor_id, event_type)
  values (p_sponsor_id, p_event_type);
end;
$$;

revoke all on function public.track_sponsor_event(uuid, text) from public;
grant execute on function public.track_sponsor_event(uuid, text) to anon, authenticated;

create or replace function public.sponsor_metrics(p_championship_id uuid)
returns table (
  sponsor_id uuid,
  views bigint,
  clicks bigint
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not is_championship_admin(p_championship_id) then
    raise exception 'Sem permissão para ver métricas deste campeonato.';
  end if;

  return query
    select
      s.id,
      count(*) filter (where e.event_type = 'view'),
      count(*) filter (where e.event_type = 'click')
    from public.sponsors s
    left join public.sponsor_events e on e.sponsor_id = s.id
    where s.championship_id = p_championship_id
    group by s.id;
end;
$$;

revoke all on function public.sponsor_metrics(uuid) from public;
revoke execute on function public.sponsor_metrics(uuid) from anon;
grant execute on function public.sponsor_metrics(uuid) to authenticated;
