-- ============================================================
-- Bolão de artilheiro e de campeão: além do placar por jogo e da
-- classificação por grupo, o torcedor pode palpitar quem será o
-- artilheiro do campeonato e qual time será campeão. Pontos entram
-- na mesma pontuação geral do bolão.
-- ============================================================
create table if not exists public.bolao_topscorer_predictions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (championship_id, user_id)
);

create table if not exists public.bolao_champion_predictions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (championship_id, user_id)
);

create index if not exists idx_bolao_topscorer_predictions_championship
  on public.bolao_topscorer_predictions(championship_id);
create index if not exists idx_bolao_champion_predictions_championship
  on public.bolao_champion_predictions(championship_id);

alter table public.bolao_topscorer_predictions enable row level security;
alter table public.bolao_champion_predictions enable row level security;

-- Palpite fica visível só para o próprio torcedor enquanto o
-- campeonato estiver rolando; vira público assim que todos os jogos
-- já tiverem sido realizados (temporada encerrada).
create policy "bolao_topscorer_predictions_select_own_or_finished" on public.bolao_topscorer_predictions
  for select using (
    user_id = (select auth.uid())
    or (
      exists (select 1 from public.games g where g.championship_id = bolao_topscorer_predictions.championship_id)
      and not exists (
        select 1 from public.games g
        where g.championship_id = bolao_topscorer_predictions.championship_id and g.played = false
      )
    )
  );

create policy "bolao_topscorer_predictions_insert_own" on public.bolao_topscorer_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.players p
      where p.id = player_id and p.championship_id = bolao_topscorer_predictions.championship_id
    )
    and not exists (
      select 1 from public.games g
      where g.championship_id = bolao_topscorer_predictions.championship_id and g.played = true
    )
  );

create policy "bolao_topscorer_predictions_update_own" on public.bolao_topscorer_predictions
  for update using (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.games g
      where g.championship_id = bolao_topscorer_predictions.championship_id and g.played = true
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.players p
      where p.id = player_id and p.championship_id = bolao_topscorer_predictions.championship_id
    )
    and not exists (
      select 1 from public.games g
      where g.championship_id = bolao_topscorer_predictions.championship_id and g.played = true
    )
  );

create policy "bolao_topscorer_predictions_delete_own" on public.bolao_topscorer_predictions
  for delete using (user_id = (select auth.uid()));

create policy "bolao_champion_predictions_select_own_or_finished" on public.bolao_champion_predictions
  for select using (
    user_id = (select auth.uid())
    or (
      exists (select 1 from public.games g where g.championship_id = bolao_champion_predictions.championship_id)
      and not exists (
        select 1 from public.games g
        where g.championship_id = bolao_champion_predictions.championship_id and g.played = false
      )
    )
  );

create policy "bolao_champion_predictions_insert_own" on public.bolao_champion_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id and t.championship_id = bolao_champion_predictions.championship_id
    )
    and not exists (
      select 1 from public.games g
      where g.championship_id = bolao_champion_predictions.championship_id and g.played = true
    )
  );

create policy "bolao_champion_predictions_update_own" on public.bolao_champion_predictions
  for update using (
    user_id = (select auth.uid())
    and not exists (
      select 1 from public.games g
      where g.championship_id = bolao_champion_predictions.championship_id and g.played = true
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id and t.championship_id = bolao_champion_predictions.championship_id
    )
    and not exists (
      select 1 from public.games g
      where g.championship_id = bolao_champion_predictions.championship_id and g.played = true
    )
  );

create policy "bolao_champion_predictions_delete_own" on public.bolao_champion_predictions
  for delete using (user_id = (select auth.uid()));
