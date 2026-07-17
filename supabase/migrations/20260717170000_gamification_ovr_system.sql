create table if not exists public.player_attributes (
  player_id uuid primary key references public.players(id) on delete cascade,
  ovr numeric(5,2) not null default 70,
  ritmo numeric(5,2) not null default 70,
  finalizacao numeric(5,2) not null default 70,
  passe numeric(5,2) not null default 70,
  drible numeric(5,2) not null default 70,
  defesa numeric(5,2) not null default 70,
  fisico numeric(5,2) not null default 70,
  updated_at timestamptz not null default now()
);
alter table public.player_attributes enable row level security;
create policy "player_attributes_select_public" on public.player_attributes for select using (true);
create policy "player_attributes_insert_admin" on public.player_attributes for insert with check (is_admin());
create policy "player_attributes_update_admin" on public.player_attributes for update using (is_admin()) with check (is_admin());
create policy "player_attributes_delete_admin" on public.player_attributes for delete using (is_admin());

create table if not exists public.ovr_history (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  round text,
  reason text not null,
  delta numeric(5,2) not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_ovr_history_player on public.ovr_history(player_id);
create index if not exists idx_ovr_history_round on public.ovr_history(championship_id, round);
alter table public.ovr_history enable row level security;
create policy "ovr_history_select_public" on public.ovr_history for select using (true);
create policy "ovr_history_insert_admin" on public.ovr_history for insert with check (is_admin());
create policy "ovr_history_delete_admin" on public.ovr_history for delete using (is_admin());

alter table public.games
  add column if not exists mvp_player_id uuid references public.players(id) on delete set null,
  add column if not exists ovr_processed_at timestamptz;

create or replace function public.handle_new_player()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.player_attributes (player_id) values (new.id) on conflict (player_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_player_created on public.players;
create trigger on_player_created
  after insert on public.players
  for each row execute function public.handle_new_player();

revoke execute on function public.handle_new_player() from public, anon, authenticated;
