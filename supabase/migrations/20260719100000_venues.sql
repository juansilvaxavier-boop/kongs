-- Gestão de local/campo: cadastro de locais/campos por campeonato,
-- vinculados opcionalmente aos jogos. Mesma política de acesso que
-- "teams" (leitura pública, escrita só para admin do campeonato).

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

alter table public.venues enable row level security;

create index if not exists venues_championship_id_idx on public.venues (championship_id);

create policy "venues_select_public" on public.venues for select
  using (true);

create policy "venues_insert_admin" on public.venues for insert
  with check (is_championship_admin(championship_id));

create policy "venues_update_admin" on public.venues for update
  using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

create policy "venues_delete_admin" on public.venues for delete
  using (is_championship_admin(championship_id));

alter table public.games add column if not exists venue_id uuid references public.venues(id) on delete set null;
