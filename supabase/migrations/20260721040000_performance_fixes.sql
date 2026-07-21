-- Índices ausentes em FKs novas (bolão de artilheiro/campeão), sinalizados
-- pelo advisor de performance do Supabase.
create index if not exists idx_bolao_champion_predictions_team
  on public.bolao_champion_predictions (team_id);
create index if not exists idx_bolao_champion_predictions_user
  on public.bolao_champion_predictions (user_id);
create index if not exists idx_bolao_topscorer_predictions_player
  on public.bolao_topscorer_predictions (player_id);
create index if not exists idx_bolao_topscorer_predictions_user
  on public.bolao_topscorer_predictions (user_id);
create index if not exists idx_bolao_group_predictions_team
  on public.bolao_group_predictions (team_id);

-- game_captain_signatures/game_lineups tinham uma policy "for all" de
-- gestão (admin) e uma policy "for select" pública separada, então todo
-- select avaliava as duas (multiple permissive policies). A de gestão
-- vira "for insert/update/delete", já que o select público cobre a
-- leitura sozinho.
drop policy if exists game_captain_signatures_write_admin on public.game_captain_signatures;

create policy game_captain_signatures_write_admin_insert on public.game_captain_signatures
  for insert with check (
    can_manage_teams_games(championship_id) and exists (
      select 1 from games g
      where g.id = game_captain_signatures.game_id
        and g.championship_id = game_captain_signatures.championship_id
        and (game_captain_signatures.team_id = g.team_a_id or game_captain_signatures.team_id = g.team_b_id)
    )
  );

create policy game_captain_signatures_write_admin_update on public.game_captain_signatures
  for update using (can_manage_teams_games(championship_id))
  with check (
    can_manage_teams_games(championship_id) and exists (
      select 1 from games g
      where g.id = game_captain_signatures.game_id
        and g.championship_id = game_captain_signatures.championship_id
        and (game_captain_signatures.team_id = g.team_a_id or game_captain_signatures.team_id = g.team_b_id)
    )
  );

create policy game_captain_signatures_write_admin_delete on public.game_captain_signatures
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists game_lineups_write_admin on public.game_lineups;

create policy game_lineups_write_admin_insert on public.game_lineups
  for insert with check (
    can_manage_teams_games(championship_id) and exists (
      select 1 from games g
      where g.id = game_lineups.game_id and g.championship_id = game_lineups.championship_id
    )
  );

create policy game_lineups_write_admin_update on public.game_lineups
  for update using (can_manage_teams_games(championship_id))
  with check (
    can_manage_teams_games(championship_id) and exists (
      select 1 from games g
      where g.id = game_lineups.game_id and g.championship_id = game_lineups.championship_id
    )
  );

create policy game_lineups_write_admin_delete on public.game_lineups
  for delete using (can_manage_teams_games(championship_id));
