create table if not exists public.bolao_predictions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  predicted_score_a int not null check (predicted_score_a >= 0),
  predicted_score_b int not null check (predicted_score_b >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, user_id)
);
create index if not exists idx_bolao_predictions_championship on public.bolao_predictions(championship_id);
create index if not exists idx_bolao_predictions_game on public.bolao_predictions(game_id);
create index if not exists idx_bolao_predictions_user on public.bolao_predictions(user_id);

alter table public.bolao_predictions enable row level security;

-- Palpites de jogos ainda não realizados ficam visíveis só para o próprio
-- torcedor (senão dá pra copiar o palpite dos outros antes do jogo).
-- Depois que o jogo é marcado como realizado, os palpites viram públicos
-- para alimentar o ranking do bolão.
create policy "bolao_predictions_select_own_or_played" on public.bolao_predictions
  for select using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.games g where g.id = game_id and g.played = true
    )
  );

create policy "bolao_predictions_insert_own" on public.bolao_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.played = false)
  );

create policy "bolao_predictions_update_own" on public.bolao_predictions
  for update using (
    user_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.played = false)
  )
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.played = false)
  );

create policy "bolao_predictions_delete_own" on public.bolao_predictions
  for delete using (user_id = (select auth.uid()));
