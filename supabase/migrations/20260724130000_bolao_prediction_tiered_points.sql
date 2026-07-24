-- Palpite de artilheiro/campeão passa a valer menos pontos quanto mais
-- tarde for feito (10 antes de qualquer jogo, 5 já com a fase de
-- grupos/liga rolando, 3 já com o mata-mata começado) em vez de ficar
-- travado assim que o campeonato começa. Continua podendo ser feito ou
-- alterado até o campeonato terminar (mesma janela usada para revelar o
-- palpite a outros torcedores). O valor é travado no momento do
-- palpite/alteração, não recalculado depois.

alter table public.bolao_topscorer_predictions
  add column if not exists points integer not null default 10;
alter table public.bolao_champion_predictions
  add column if not exists points integer not null default 10;

create or replace function public.bolao_prediction_tier(p_championship_id uuid)
returns int
language sql
stable
security invoker
set search_path = public
as $$
  select case
    when not exists (
      select 1 from public.games g
      where g.championship_id = p_championship_id and g.played = true
    ) then 10
    when coalesce(
      (select c.has_knockout_stage from public.championships c where c.id = p_championship_id),
      false
    ) and exists (
      select 1 from public.games g
      where g.championship_id = p_championship_id
        and g.played = true
        and g.round !~ 'Rodada [0-9]+$'
    ) then 3
    else 5
  end;
$$;

grant execute on function public.bolao_prediction_tier(uuid) to authenticated;

drop policy if exists "bolao_topscorer_predictions_insert_own" on public.bolao_topscorer_predictions;
create policy "bolao_topscorer_predictions_insert_own" on public.bolao_topscorer_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.players p
      where p.id = player_id and p.championship_id = bolao_topscorer_predictions.championship_id
    )
    and (
      not exists (select 1 from public.games g where g.championship_id = bolao_topscorer_predictions.championship_id)
      or exists (
        select 1 from public.games g
        where g.championship_id = bolao_topscorer_predictions.championship_id and g.played = false
      )
    )
    and points = public.bolao_prediction_tier(bolao_topscorer_predictions.championship_id)
  );

drop policy if exists "bolao_topscorer_predictions_update_own" on public.bolao_topscorer_predictions;
create policy "bolao_topscorer_predictions_update_own" on public.bolao_topscorer_predictions
  for update using (
    user_id = (select auth.uid())
    and (
      not exists (select 1 from public.games g where g.championship_id = bolao_topscorer_predictions.championship_id)
      or exists (
        select 1 from public.games g
        where g.championship_id = bolao_topscorer_predictions.championship_id and g.played = false
      )
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.players p
      where p.id = player_id and p.championship_id = bolao_topscorer_predictions.championship_id
    )
    and points = public.bolao_prediction_tier(bolao_topscorer_predictions.championship_id)
  );

drop policy if exists "bolao_champion_predictions_insert_own" on public.bolao_champion_predictions;
create policy "bolao_champion_predictions_insert_own" on public.bolao_champion_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id and t.championship_id = bolao_champion_predictions.championship_id
    )
    and (
      not exists (select 1 from public.games g where g.championship_id = bolao_champion_predictions.championship_id)
      or exists (
        select 1 from public.games g
        where g.championship_id = bolao_champion_predictions.championship_id and g.played = false
      )
    )
    and points = public.bolao_prediction_tier(bolao_champion_predictions.championship_id)
  );

drop policy if exists "bolao_champion_predictions_update_own" on public.bolao_champion_predictions;
create policy "bolao_champion_predictions_update_own" on public.bolao_champion_predictions
  for update using (
    user_id = (select auth.uid())
    and (
      not exists (select 1 from public.games g where g.championship_id = bolao_champion_predictions.championship_id)
      or exists (
        select 1 from public.games g
        where g.championship_id = bolao_champion_predictions.championship_id and g.played = false
      )
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id and t.championship_id = bolao_champion_predictions.championship_id
    )
    and points = public.bolao_prediction_tier(bolao_champion_predictions.championship_id)
  );
