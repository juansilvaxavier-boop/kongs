-- ============================================================
-- Auditoria de segurança solicitada pelo usuário. Corrige falhas de
-- autorização em nível de banco que permitiam, na teoria, forjar
-- dados entre campeonatos diferentes ou burlar o token da
-- súmula/elenco. Nenhuma foi explorada em produção — verificado
-- antes de aplicar (zero linhas com championship_id/team_id/game_id
-- inconsistentes).
-- ============================================================

-- ------------------------------------------------------------
-- 1) goal_events / card_events: a policy de admin só conferia o
--    championship_id da PRÓPRIA linha, nunca que o game_id apontado
--    realmente pertence a esse campeonato. Um admin do campeonato A
--    conseguia inserir/editar um evento com championship_id = A mas
--    game_id de um jogo do campeonato B.
-- ------------------------------------------------------------
drop policy if exists "goal_events_insert_admin" on public.goal_events;
create policy "goal_events_insert_admin" on public.goal_events
  for insert with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = goal_events.game_id and g.championship_id = goal_events.championship_id
    )
  );

drop policy if exists "goal_events_update_admin" on public.goal_events;
create policy "goal_events_update_admin" on public.goal_events
  for update using (is_championship_admin(championship_id))
  with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = goal_events.game_id and g.championship_id = goal_events.championship_id
    )
  );

drop policy if exists "card_events_insert_admin" on public.card_events;
create policy "card_events_insert_admin" on public.card_events
  for insert with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = card_events.game_id and g.championship_id = card_events.championship_id
    )
  );

drop policy if exists "card_events_update_admin" on public.card_events;
create policy "card_events_update_admin" on public.card_events
  for update using (is_championship_admin(championship_id))
  with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = card_events.game_id and g.championship_id = card_events.championship_id
    )
  );

-- ------------------------------------------------------------
-- 2) players: o ramo "owner" já conferia team.championship_id =
--    players.championship_id; o ramo "admin" não. Um admin do
--    campeonato A podia inserir/mover um jogador com championship_id
--    = A mas team_id de um time do campeonato B.
-- ------------------------------------------------------------
drop policy if exists "players_insert_admin_or_owner" on public.players;
create policy "players_insert_admin_or_owner" on public.players
  for insert with check (
    (
      is_championship_admin(championship_id)
      and (
        players.team_id is null
        or exists (
          select 1 from public.teams t
          where t.id = players.team_id and t.championship_id = players.championship_id
        )
      )
    )
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = (select auth.uid())
          and t.championship_id = players.championship_id
      )
    )
  );

drop policy if exists "players_update_admin_or_owner" on public.players;
create policy "players_update_admin_or_owner" on public.players
  for update using (
    is_championship_admin(championship_id)
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id and t.owner_user_id = (select auth.uid())
      )
    )
  ) with check (
    (
      is_championship_admin(championship_id)
      and (
        players.team_id is null
        or exists (
          select 1 from public.teams t
          where t.id = players.team_id and t.championship_id = players.championship_id
        )
      )
    )
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = (select auth.uid())
          and t.championship_id = players.championship_id
      )
    )
  );

-- ------------------------------------------------------------
-- 3) game_lineups / game_captain_signatures: mesma lacuna — só
--    conferiam championship_id da própria linha, nunca que o game_id
--    pertence a esse campeonato (e, no caso da assinatura, que o
--    team_id realmente é um dos dois times do jogo).
-- ------------------------------------------------------------
drop policy if exists "game_lineups_write_admin" on public.game_lineups;
create policy "game_lineups_write_admin" on public.game_lineups
  for all using (is_championship_admin(championship_id))
  with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = game_lineups.game_id and g.championship_id = game_lineups.championship_id
    )
  );

drop policy if exists "game_captain_signatures_write_admin" on public.game_captain_signatures;
create policy "game_captain_signatures_write_admin" on public.game_captain_signatures
  for all using (is_championship_admin(championship_id))
  with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = game_captain_signatures.game_id
        and g.championship_id = game_captain_signatures.championship_id
        and game_captain_signatures.team_id in (g.team_a_id, g.team_b_id)
    )
  );

-- ------------------------------------------------------------
-- 4) bolao_predictions: garante que championship_id bate com o
--    campeonato real do jogo. Nit de integridade — não vazava
--    palpite de outro usuário, já que user_id continuava
--    self-scoped, mas evita que o ranking por campeonato misture
--    palpites com championship_id inconsistente.
-- ------------------------------------------------------------
drop policy if exists "bolao_predictions_insert_own" on public.bolao_predictions;
create policy "bolao_predictions_insert_own" on public.bolao_predictions
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.played = false and g.championship_id = bolao_predictions.championship_id
    )
  );

drop policy if exists "bolao_predictions_update_own" on public.bolao_predictions;
create policy "bolao_predictions_update_own" on public.bolao_predictions
  for update using (
    user_id = (select auth.uid())
    and exists (select 1 from public.games g where g.id = game_id and g.played = false)
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.games g
      where g.id = game_id and g.played = false and g.championship_id = bolao_predictions.championship_id
    )
  );

-- ------------------------------------------------------------
-- 5) process_game_ovr: motor interno de recálculo de OVR, sem
--    NENHUMA verificação de autorização, liberado direto para
--    anon/authenticated via RPC (`/rest/v1/rpc/process_game_ovr`) —
--    qualquer um podia chamá-lo com um game_id arbitrário.
--
--    Ele precisa continuar chamável (a) pelo admin autenticado, via
--    server action, depois de lançar gol/cartão/reabrir jogo, e (b)
--    de dentro das funções sumula_* (mesário anônimo, já validado
--    por token) via `perform`. Uma chamada aninhada feita de dentro
--    de outra função SECURITY DEFINER roda como o DONO da função (não
--    como quem originalmente chamou a função externa), então (b)
--    continua funcionando mesmo revogando o EXECUTE direto de
--    anon/authenticated aqui — só fecha a porta de chamar
--    `process_game_ovr` direto pela API REST.
--
--    Criamos um portão (`admin_process_game_ovr`) que confere
--    is_championship_admin antes de chamar o motor; é isso que o
--    código do admin passa a usar (src/.../jogos/ovr-processing.ts).
-- ------------------------------------------------------------
create or replace function public.admin_process_game_ovr(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
begin
  select championship_id into v_championship_id from public.games where id = p_game_id;
  if v_championship_id is null then
    return;
  end if;
  if not public.is_championship_admin(v_championship_id) then
    raise exception 'Sem permissão para reprocessar este jogo.';
  end if;

  perform public.process_game_ovr(p_game_id);
end;
$$;

revoke all on function public.admin_process_game_ovr(uuid) from public, anon;
grant execute on function public.admin_process_game_ovr(uuid) to authenticated;

revoke all on function public.process_game_ovr(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------
-- 6) player-photos (link do elenco): roster_can_upload_player_photo
--    só recebia o player_id e conferia "esse jogador pertence a um
--    time com cadastro ainda aberto (não enviado)" — nunca validava
--    que quem está chamando de fato possui o TOKEN daquele time.
--    Como player_id é dado público (players_select_public), qualquer
--    visitante anônimo conseguia sobrescrever a foto de QUALQUER
--    jogador de QUALQUER time com cadastro ainda aberto, sem nunca
--    ter visto o link do elenco daquele time.
--
--    Corrige embutindo o token no próprio caminho do arquivo
--    (`{token}/{playerId}/photo.ext`) e conferindo o token na policy,
--    igual ao padrão já usado pelas roster_*/sumula_* functions. Os
--    uploads feitos pelo admin autenticado usam outro caminho
--    (`{playerId}/photo.ext`, sem token) e outra policy (item 7),
--    não são afetados.
-- ------------------------------------------------------------
drop policy if exists "player_photos_insert_roster_link" on storage.objects;
drop policy if exists "player_photos_update_roster_link" on storage.objects;
drop policy if exists "player_photos_select_roster_link" on storage.objects;
drop function if exists public.roster_can_upload_player_photo(uuid);

create or replace function public.roster_can_upload_player_photo(p_token uuid, p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players p
    join public.team_roster_tokens trt on trt.team_id = p.team_id
    where p.id = p_player_id
      and trt.token = p_token
      and trt.submitted_at is null
  );
$$;

revoke all on function public.roster_can_upload_player_photo(uuid, uuid) from public;
grant execute on function public.roster_can_upload_player_photo(uuid, uuid) to anon, authenticated;

create policy "player_photos_insert_roster_link"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'player-photos'
  and public.roster_can_upload_player_photo(
    ((storage.foldername(name))[1])::uuid,
    ((storage.foldername(name))[2])::uuid
  )
);

create policy "player_photos_update_roster_link"
on storage.objects for update
to anon, authenticated
using (
  bucket_id = 'player-photos'
  and public.roster_can_upload_player_photo(
    ((storage.foldername(name))[1])::uuid,
    ((storage.foldername(name))[2])::uuid
  )
);

create policy "player_photos_select_roster_link"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'player-photos'
  and public.roster_can_upload_player_photo(
    ((storage.foldername(name))[1])::uuid,
    ((storage.foldername(name))[2])::uuid
  )
);

-- ------------------------------------------------------------
-- 7) crests / player-photos (upload do admin): as policies só
--    conferiam is_admin() — um flag GLOBAL ("é organizador de algum
--    campeonato"), não is_championship_admin() escopado. Qualquer
--    admin de QUALQUER campeonato conseguia sobrescrever o escudo ou
--    a foto de um time/jogador de outro organizador, já que
--    team_id/player_id não são segredo (select público).
-- ------------------------------------------------------------
drop policy if exists "crests_insert_admin" on storage.objects;
create policy "crests_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'crests'
    and is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "crests_update_admin" on storage.objects;
create policy "crests_update_admin" on storage.objects
  for update using (
    bucket_id = 'crests'
    and is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "crests_delete_admin" on storage.objects;
create policy "crests_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'crests'
    and is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_insert_admin" on storage.objects;
create policy "player_photos_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_update_admin" on storage.objects;
create policy "player_photos_update_admin" on storage.objects
  for update using (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_delete_admin" on storage.objects;
create policy "player_photos_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(name))[1])::uuid
    ))
  );
