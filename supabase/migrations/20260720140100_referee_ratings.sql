-- ============================================================
-- Avaliação de arbitragem: cada time avalia o árbitro de um jogo
-- (1 avaliação por time por jogo), só depois do jogo realizado.
-- ============================================================
create table if not exists public.referee_ratings (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  referee_id uuid not null references public.referees(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (game_id, team_id)
);

create index if not exists idx_referee_ratings_championship
  on public.referee_ratings(championship_id);
create index if not exists idx_referee_ratings_referee
  on public.referee_ratings(referee_id);

alter table public.referee_ratings enable row level security;

create policy "referee_ratings_select_admin_or_own_team" on public.referee_ratings
  for select using (
    is_championship_admin(referee_ratings.championship_id)
    or exists (
      select 1 from public.teams t
      where t.id = referee_ratings.team_id
        and t.owner_user_id = (select auth.uid())
    )
  );

create policy "referee_ratings_insert_team_owner" on public.referee_ratings
  for insert with check (
    exists (
      select 1 from public.teams t
      join public.games g on g.id = referee_ratings.game_id
      where t.id = referee_ratings.team_id
        and t.owner_user_id = (select auth.uid())
        and g.played = true
        and g.referee_id = referee_ratings.referee_id
        and (g.team_a_id = t.id or g.team_b_id = t.id)
    )
  );

create policy "referee_ratings_update_team_owner" on public.referee_ratings
  for update
  using (
    exists (
      select 1 from public.teams t
      where t.id = referee_ratings.team_id
        and t.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.teams t
      join public.games g on g.id = referee_ratings.game_id
      where t.id = referee_ratings.team_id
        and t.owner_user_id = (select auth.uid())
        and g.played = true
        and g.referee_id = referee_ratings.referee_id
        and (g.team_a_id = t.id or g.team_b_id = t.id)
    )
  );
