create index if not exists idx_game_captain_signatures_championship on public.game_captain_signatures (championship_id);
create index if not exists idx_game_captain_signatures_team on public.game_captain_signatures (team_id);
create index if not exists idx_game_lineups_championship on public.game_lineups (championship_id);
create index if not exists idx_game_lineups_player on public.game_lineups (player_id);
create index if not exists idx_games_mvp_player on public.games (mvp_player_id);
create index if not exists idx_games_referee on public.games (referee_id);
create index if not exists idx_games_venue on public.games (venue_id);
create index if not exists idx_ovr_history_game on public.ovr_history (game_id);
