create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('game', 'team', 'player')),
  entity_id uuid not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, entity_id)
);

create index if not exists idx_favorites_user on public.favorites (user_id);
create index if not exists idx_favorites_entity on public.favorites (kind, entity_id);

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select using (user_id = (select auth.uid()));

create policy "favorites_insert_own" on public.favorites
  for insert with check (user_id = (select auth.uid()));

create policy "favorites_delete_own" on public.favorites
  for delete using (user_id = (select auth.uid()));
