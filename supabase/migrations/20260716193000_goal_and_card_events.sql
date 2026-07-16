create table if not exists public.goal_events (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  minute int,
  created_at timestamptz not null default now()
);

create table if not exists public.card_events (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  card_type text not null check (card_type in ('yellow', 'red')),
  minute int,
  created_at timestamptz not null default now()
);

create index if not exists idx_goal_events_championship on public.goal_events(championship_id);
create index if not exists idx_goal_events_game on public.goal_events(game_id);
create index if not exists idx_goal_events_player on public.goal_events(player_id);
create index if not exists idx_card_events_championship on public.card_events(championship_id);
create index if not exists idx_card_events_game on public.card_events(game_id);
create index if not exists idx_card_events_player on public.card_events(player_id);

alter table public.goal_events enable row level security;
alter table public.card_events enable row level security;

create policy "goal_events_select_public" on public.goal_events
  for select using (true);
create policy "goal_events_write_admin" on public.goal_events
  for all using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

create policy "card_events_select_public" on public.card_events
  for select using (true);
create policy "card_events_write_admin" on public.card_events
  for all using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));
