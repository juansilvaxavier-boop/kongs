-- Formato do campeonato e regras de disciplina configuráveis
alter table public.championships
  add column if not exists format text not null default 'liga' check (format in ('liga', 'copa'));
alter table public.championships
  add column if not exists has_knockout_stage boolean not null default false;
alter table public.championships
  add column if not exists yellow_cards_for_suspension int not null default 3 check (yellow_cards_for_suspension > 0);

-- Perfis: qualquer usuário autenticado gerencia o próprio (nome, foto, "sou...")
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  persona text check (persona in ('jogador', 'treinador', 'torcedor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_public" on public.profiles
  for select using (true);
create policy "profiles_insert_own" on public.profiles
  for insert with check (user_id = (select auth.uid()));
create policy "profiles_update_own" on public.profiles
  for update using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Comentários por campeonato: leitura pública, escrita exige login
create table if not exists public.championship_comments (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create index if not exists idx_championship_comments_championship on public.championship_comments(championship_id);
create index if not exists idx_championship_comments_user on public.championship_comments(user_id);

alter table public.championship_comments enable row level security;

create policy "championship_comments_select_public" on public.championship_comments
  for select using (true);
create policy "championship_comments_insert_own" on public.championship_comments
  for insert with check (
    (select auth.uid()) is not null and user_id = (select auth.uid())
  );
create policy "championship_comments_delete_own_or_admin" on public.championship_comments
  for delete using (
    user_id = (select auth.uid()) or is_championship_admin(championship_id)
  );
