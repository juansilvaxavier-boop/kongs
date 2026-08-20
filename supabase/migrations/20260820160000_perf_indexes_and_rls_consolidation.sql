-- Índices que faltavam em foreign keys (detectados pelo advisor de performance).
create index if not exists idx_racha_session_confirmations_championship_id
  on public.racha_session_confirmations (championship_id);

create index if not exists idx_racha_sessions_game_id
  on public.racha_sessions (game_id);

-- Consolida políticas RLS permissivas duplicadas na mesma ação (advisor de
-- performance "Multiple Permissive Policies") em uma única política com OR,
-- sem mudar quem tem acesso a quê.

-- championships: INSERT tinha uma política pra "campeonato" e outra pra "racha".
drop policy if exists championships_insert_admin on public.championships;
drop policy if exists championships_insert_racha_any_user on public.championships;
create policy championships_insert on public.championships
  for insert
  with check (
    (kind = 'campeonato' and (is_admin() or has_permission('manage_championships')) and owner_id = (select auth.uid()))
    or
    (kind = 'racha' and owner_id = (select auth.uid()))
  );

-- players: INSERT tinha uma política pra admin/dono do time e outra pra
-- autocadastro de jogador em racha.
drop policy if exists players_insert_admin_or_owner on public.players;
drop policy if exists players_insert_self_racha on public.players;
create policy players_insert on public.players
  for insert
  with check (
    (can_manage_teams_games(championship_id) and (team_id is null or exists (
      select 1 from teams t where t.id = players.team_id and t.championship_id = players.championship_id
    )))
    or
    (team_id is not null and exists (
      select 1 from teams t
      where t.id = players.team_id
        and t.owner_user_id = (select auth.uid())
        and t.championship_id = players.championship_id
    ))
    or
    (user_id = (select auth.uid()) and exists (
      select 1 from championships c where c.id = players.championship_id and c.kind = 'racha'
    ))
  );

-- racha_session_confirmations: a política de admin era "ALL" (cobrindo
-- SELECT também), duplicando a política pública de SELECT. Troca por
-- políticas específicas de INSERT/UPDATE/DELETE, mantendo o SELECT público
-- como a única política de leitura.
drop policy if exists racha_confirmations_write_admin on public.racha_session_confirmations;

create policy racha_confirmations_insert_admin on public.racha_session_confirmations
  for insert
  with check (is_championship_admin(championship_id));

create policy racha_confirmations_update_admin on public.racha_session_confirmations
  for update
  using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

create policy racha_confirmations_delete_admin on public.racha_session_confirmations
  for delete
  using (is_championship_admin(championship_id));
