-- ============================================================
-- Bolão de classificação: além do placar de cada jogo, o torcedor
-- pode palpitar qual time termina em cada posição de cada grupo
-- (ou da tabela única, em campeonatos no formato liga). Os pontos
-- entram na mesma pontuação geral do bolão.
-- ============================================================
create table if not exists public.bolao_group_predictions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  group_name text,
  position int not null check (position >= 1),
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_bolao_group_predictions_championship
  on public.bolao_group_predictions(championship_id);
create index if not exists idx_bolao_group_predictions_user
  on public.bolao_group_predictions(user_id);

-- group_name pode ser null (campeonato sem grupos, tabela única) e o
-- Postgres trata NULL como distinto em unique constraints normais, então
-- usamos índices únicos com coalesce para realmente impedir duplicidade
-- também nesse caso.
create unique index if not exists idx_bolao_group_predictions_user_position
  on public.bolao_group_predictions (championship_id, user_id, coalesce(group_name, ''), position);
create unique index if not exists idx_bolao_group_predictions_user_team
  on public.bolao_group_predictions (championship_id, user_id, coalesce(group_name, ''), team_id);

alter table public.bolao_group_predictions enable row level security;

-- Palpite de grupo ainda em aberto (nenhum jogo entre os times do grupo
-- foi realizado) fica visível só para o próprio torcedor. Uma vez que o
-- grupo tenha pelo menos um jogo e todos já tenham sido realizados
-- (grupo encerrado), os palpites viram públicos para o ranking.
create policy "bolao_group_predictions_select_own_or_finished" on public.bolao_group_predictions
  for select using (
    user_id = (select auth.uid())
    or (
      exists (
        select 1
        from public.games g
        join public.teams ta on ta.id = g.team_a_id
        join public.teams tb on tb.id = g.team_b_id
        where g.championship_id = bolao_group_predictions.championship_id
          and ta.group_name is not distinct from bolao_group_predictions.group_name
          and tb.group_name is not distinct from bolao_group_predictions.group_name
      )
      and not exists (
        select 1
        from public.games g
        join public.teams ta on ta.id = g.team_a_id
        join public.teams tb on tb.id = g.team_b_id
        where g.championship_id = bolao_group_predictions.championship_id
          and g.played = false
          and ta.group_name is not distinct from bolao_group_predictions.group_name
          and tb.group_name is not distinct from bolao_group_predictions.group_name
      )
    )
  );

create policy "bolao_group_predictions_insert_own" on public.bolao_group_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id
        and t.championship_id = bolao_group_predictions.championship_id
        and t.group_name is not distinct from bolao_group_predictions.group_name
    )
    and not exists (
      select 1
      from public.games g
      join public.teams ta on ta.id = g.team_a_id
      join public.teams tb on tb.id = g.team_b_id
      where g.championship_id = bolao_group_predictions.championship_id
        and g.played = true
        and ta.group_name is not distinct from bolao_group_predictions.group_name
        and tb.group_name is not distinct from bolao_group_predictions.group_name
    )
  );

create policy "bolao_group_predictions_update_own" on public.bolao_group_predictions
  for update using (
    user_id = (select auth.uid())
    and not exists (
      select 1
      from public.games g
      join public.teams ta on ta.id = g.team_a_id
      join public.teams tb on tb.id = g.team_b_id
      where g.championship_id = bolao_group_predictions.championship_id
        and g.played = true
        and ta.group_name is not distinct from bolao_group_predictions.group_name
        and tb.group_name is not distinct from bolao_group_predictions.group_name
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id
        and t.championship_id = bolao_group_predictions.championship_id
        and t.group_name is not distinct from bolao_group_predictions.group_name
    )
    and not exists (
      select 1
      from public.games g
      join public.teams ta on ta.id = g.team_a_id
      join public.teams tb on tb.id = g.team_b_id
      where g.championship_id = bolao_group_predictions.championship_id
        and g.played = true
        and ta.group_name is not distinct from bolao_group_predictions.group_name
        and tb.group_name is not distinct from bolao_group_predictions.group_name
    )
  );

create policy "bolao_group_predictions_delete_own" on public.bolao_group_predictions
  for delete using (user_id = (select auth.uid()));
