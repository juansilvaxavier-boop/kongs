-- Extensão para UUIDs
create extension if not exists "pgcrypto";

-- Campeonatos
create table if not exists public.championships (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Técnicos
create table if not exists public.coaches (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Times
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  coach_id uuid references public.coaches(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Jogadores
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  team_id uuid references public.teams(id) on delete set null,
  name text not null,
  number int,
  position text,
  created_at timestamptz not null default now()
);

-- Jogos
create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  round text not null,
  team_a_id uuid not null references public.teams(id) on delete cascade,
  team_b_id uuid not null references public.teams(id) on delete cascade,
  date timestamptz,
  score_a int,
  score_b int,
  played boolean not null default false,
  created_at timestamptz not null default now(),
  constraint games_teams_different check (team_a_id <> team_b_id)
);

-- Índices para as chaves estrangeiras mais consultadas
create index if not exists idx_coaches_championship on public.coaches(championship_id);
create index if not exists idx_teams_championship on public.teams(championship_id);
create index if not exists idx_teams_coach on public.teams(coach_id);
create index if not exists idx_players_championship on public.players(championship_id);
create index if not exists idx_players_team on public.players(team_id);
create index if not exists idx_games_championship on public.games(championship_id);
create index if not exists idx_games_team_a on public.games(team_a_id);
create index if not exists idx_games_team_b on public.games(team_b_id);

-- Row Level Security
alter table public.championships enable row level security;
alter table public.coaches enable row level security;
alter table public.teams enable row level security;
alter table public.players enable row level security;
alter table public.games enable row level security;

-- Políticas: championships (dono direto)
create policy "championships_select_own" on public.championships
  for select using (owner_id = auth.uid());
create policy "championships_insert_own" on public.championships
  for insert with check (owner_id = auth.uid());
create policy "championships_update_own" on public.championships
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "championships_delete_own" on public.championships
  for delete using (owner_id = auth.uid());

-- Políticas: coaches (via championship)
create policy "coaches_select_own" on public.coaches
  for select using (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid()
  ));
create policy "coaches_insert_own" on public.coaches
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid()
  ));
create policy "coaches_update_own" on public.coaches
  for update using (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid()
  ));
create policy "coaches_delete_own" on public.coaches
  for delete using (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid()
  ));

-- Políticas: teams (via championship)
create policy "teams_select_own" on public.teams
  for select using (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid()
  ));
create policy "teams_insert_own" on public.teams
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid()
  ));
create policy "teams_update_own" on public.teams
  for update using (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid()
  ));
create policy "teams_delete_own" on public.teams
  for delete using (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid()
  ));

-- Políticas: players (via championship)
create policy "players_select_own" on public.players
  for select using (exists (
    select 1 from public.championships c
    where c.id = players.championship_id and c.owner_id = auth.uid()
  ));
create policy "players_insert_own" on public.players
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = players.championship_id and c.owner_id = auth.uid()
  ));
create policy "players_update_own" on public.players
  for update using (exists (
    select 1 from public.championships c
    where c.id = players.championship_id and c.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.championships c
    where c.id = players.championship_id and c.owner_id = auth.uid()
  ));
create policy "players_delete_own" on public.players
  for delete using (exists (
    select 1 from public.championships c
    where c.id = players.championship_id and c.owner_id = auth.uid()
  ));

-- Políticas: games (via championship)
create policy "games_select_own" on public.games
  for select using (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid()
  ));
create policy "games_insert_own" on public.games
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid()
  ));
create policy "games_update_own" on public.games
  for update using (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid()
  )) with check (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid()
  ));
create policy "games_delete_own" on public.games
  for delete using (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid()
  ));
