-- ============================================================
-- Redesenho da Súmula Digital: um único link por CAMPEONATO (não mais
-- por jogo) — o mesário abre o link, escolhe o jogo numa lista, e
-- preenche gols/cartões em duas tabelas lado a lado (mandante x
-- visitante). O placar deixa de ser digitado manualmente: passa a ser
-- sempre a contagem de gols de cada time, recalculada dentro do
-- próprio process_game_ovr toda vez que ele roda.
--
-- Não havia nenhum jogo realizado / gol / cartão lançado em produção
-- no momento desta migração (verificado antes de aplicar), então dá
-- para substituir a tabela de token por jogo pela de token por
-- campeonato sem risco de perder dado real.
-- ============================================================
drop function if exists public.sumula_update_score(uuid, int, int, boolean);
drop function if exists public.sumula_get_game(uuid);
drop function if exists public.get_or_create_sumula_token(uuid, uuid);
drop function if exists public.regenerate_sumula_token(uuid, uuid);
-- create or replace não troca uma função com assinatura diferente — cria
-- um overload novo. Como sumula_add_goal/sumula_add_card ganharam um
-- p_game_id a mais, as versões antigas (3/4 args) precisam ser
-- explicitamente derrubadas, senão ficam mortas referenciando a tabela
-- de token por jogo que este arquivo já remove.
drop function if exists public.sumula_add_goal(uuid, uuid, int);
drop function if exists public.sumula_add_card(uuid, uuid, text, int);
drop table if exists public.game_sumula_tokens;

create table public.championship_sumula_tokens (
  championship_id uuid primary key references public.championships(id) on delete cascade,
  token uuid not null unique default gen_random_uuid()
);
alter table public.championship_sumula_tokens enable row level security;
-- Nenhuma policy: só acessível via funções SECURITY DEFINER abaixo.

-- ============================================================
-- process_game_ovr: agora recalcula score_a/score_b a partir da
-- contagem de goal_events por time como primeiro passo (placar deixa
-- de ser um campo digitado — é sempre derivado da súmula), e só then
-- segue com a lógica de evolução de OVR já existente.
-- ============================================================
create or replace function public.process_game_ovr(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game record;
  v_rev record;
  v_player record;
  v_score_a int;
  v_score_b int;
  v_winner_team_id uuid;
  v_goals int;
  v_yellow int;
  v_red int;
  v_goals_conceded int;
  v_position text;
  v_delta numeric;
  v_impact numeric;
  v_reason text;
  v_total numeric;
  v_has_entries boolean;
  v_mvp_player_id uuid;
  v_mvp_delta numeric;
begin
  select id, championship_id, team_a_id, team_b_id, played, round
    into v_game
  from public.games
  where id = p_game_id;

  if v_game.id is null then
    return;
  end if;

  select count(*) into v_score_a
  from public.goal_events ge
  join public.players p on p.id = ge.player_id
  where ge.game_id = p_game_id and p.team_id = v_game.team_a_id;

  select count(*) into v_score_b
  from public.goal_events ge
  join public.players p on p.id = ge.player_id
  where ge.game_id = p_game_id and p.team_id = v_game.team_b_id;

  update public.games set score_a = v_score_a, score_b = v_score_b where id = p_game_id;

  for v_rev in
    select player_id, sum(delta) as total
    from public.ovr_history
    where game_id = p_game_id
    group by player_id
  loop
    update public.player_attributes
    set ovr = least(99, greatest(0, round2(ovr - v_rev.total))),
        ritmo = least(99, greatest(0, round2(ritmo - v_rev.total))),
        finalizacao = least(99, greatest(0, round2(finalizacao - v_rev.total))),
        passe = least(99, greatest(0, round2(passe - v_rev.total))),
        drible = least(99, greatest(0, round2(drible - v_rev.total))),
        defesa = least(99, greatest(0, round2(defesa - v_rev.total))),
        fisico = least(99, greatest(0, round2(fisico - v_rev.total))),
        updated_at = now()
    where player_id = v_rev.player_id;
  end loop;

  delete from public.ovr_history where game_id = p_game_id;

  if not v_game.played then
    update public.games set mvp_player_id = null, ovr_processed_at = null where id = p_game_id;
    return;
  end if;

  v_winner_team_id := case
    when v_score_a > v_score_b then v_game.team_a_id
    when v_score_b > v_score_a then v_game.team_b_id
    else null
  end;

  v_mvp_player_id := null;
  v_mvp_delta := null;

  for v_player in
    select id, team_id, position
    from public.players
    where team_id in (v_game.team_a_id, v_game.team_b_id)
  loop
    v_goals := (select count(*) from public.goal_events where game_id = p_game_id and player_id = v_player.id);
    v_yellow := (select count(*) from public.card_events where game_id = p_game_id and player_id = v_player.id and card_type = 'yellow');
    v_red := (select count(*) from public.card_events where game_id = p_game_id and player_id = v_player.id and card_type = 'red');
    v_goals_conceded := case when v_player.team_id = v_game.team_a_id then v_score_b else v_score_a end;
    v_position := v_player.position;
    if v_position is null or v_position not in ('Goleiro', 'Zagueiro', 'Meia', 'Atacante') then
      v_position := 'Meia';
    end if;

    v_total := 0;
    v_has_entries := false;

    if v_goals > 0 then
      v_delta := round2(v_goals * 0.30);
      v_reason := case when v_goals = 1 then '1 gol' else v_goals || ' gols' end;
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, v_reason, v_delta);
      v_total := v_total + v_delta;
      v_has_entries := true;
    end if;

    if v_player.team_id = v_winner_team_id then
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, 'Vitória', 0.20);
      v_total := v_total + 0.20;
      v_has_entries := true;
    end if;

    if v_yellow > 0 then
      v_delta := round2(-v_yellow * 0.15);
      v_reason := case when v_yellow = 1 then 'Cartão amarelo' else v_yellow || ' cartões amarelos' end;
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, v_reason, v_delta);
      v_total := v_total + v_delta;
      v_has_entries := true;
    end if;

    if v_red > 0 then
      v_delta := round2(-v_red * 0.50);
      v_reason := case when v_red = 1 then 'Cartão vermelho' else v_red || ' cartões vermelhos' end;
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, v_reason, v_delta);
      v_total := v_total + v_delta;
      v_has_entries := true;
    end if;

    if v_position in ('Zagueiro', 'Goleiro') then
      v_impact := round2((3.5 - v_goals_conceded) * (case when v_position = 'Zagueiro' then 0.15 else 0.25 end));
      if v_impact <> 0 then
        insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
        values (
          v_player.id, v_game.championship_id, p_game_id, v_game.round,
          'Impacto defensivo (' || v_goals_conceded || ' gols sofridos)', v_impact
        );
        v_total := v_total + v_impact;
        v_has_entries := true;
      end if;
    end if;

    if not v_has_entries then
      continue;
    end if;

    if v_total <> 0 then
      update public.player_attributes
      set ovr = least(99, greatest(0, round2(ovr + v_total))),
          ritmo = least(99, greatest(0, round2(ritmo + v_total))),
          finalizacao = least(99, greatest(0, round2(finalizacao + v_total))),
          passe = least(99, greatest(0, round2(passe + v_total))),
          drible = least(99, greatest(0, round2(drible + v_total))),
          defesa = least(99, greatest(0, round2(defesa + v_total))),
          fisico = least(99, greatest(0, round2(fisico + v_total))),
          updated_at = now()
      where player_id = v_player.id;
    end if;

    if v_mvp_delta is null or v_total > v_mvp_delta then
      v_mvp_delta := v_total;
      v_mvp_player_id := v_player.id;
    end if;
  end loop;

  update public.games
  set mvp_player_id = v_mvp_player_id, ovr_processed_at = now()
  where id = p_game_id;
end;
$$;

revoke all on function public.process_game_ovr(uuid) from public;
grant execute on function public.process_game_ovr(uuid) to anon, authenticated;

-- ============================================================
-- Admin: gerar/consultar e regenerar o link da súmula do campeonato.
-- ============================================================
create or replace function public.get_or_create_championship_sumula_token(p_championship_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
begin
  if not public.is_championship_admin(p_championship_id) then
    raise exception 'Sem permissão para gerar o link da súmula.';
  end if;

  insert into public.championship_sumula_tokens (championship_id)
  values (p_championship_id)
  on conflict (championship_id) do nothing;

  select token into v_token from public.championship_sumula_tokens where championship_id = p_championship_id;
  return v_token;
end;
$$;

revoke all on function public.get_or_create_championship_sumula_token(uuid) from public, anon;
grant execute on function public.get_or_create_championship_sumula_token(uuid) to authenticated;

create or replace function public.regenerate_championship_sumula_token(p_championship_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid := gen_random_uuid();
begin
  if not public.is_championship_admin(p_championship_id) then
    raise exception 'Sem permissão para gerar o link da súmula.';
  end if;

  insert into public.championship_sumula_tokens (championship_id, token)
  values (p_championship_id, v_token)
  on conflict (championship_id) do update set token = v_token;

  return v_token;
end;
$$;

revoke all on function public.regenerate_championship_sumula_token(uuid) from public, anon;
grant execute on function public.regenerate_championship_sumula_token(uuid) to authenticated;

-- ============================================================
-- Mesário (sem login): resolver o token, listar os jogos do
-- campeonato, abrir um jogo específico e lançar gols/cartões/status.
-- ============================================================
create or replace function public.sumula_get_championship(p_token uuid)
returns table (championship_id uuid, championship_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;

  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  return query
  select c.id, c.name from public.championships c where c.id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_championship(uuid) from public;
grant execute on function public.sumula_get_championship(uuid) to anon, authenticated;

create or replace function public.sumula_list_games(p_token uuid)
returns table (
  game_id uuid,
  round text,
  date timestamptz,
  team_a_name text,
  team_b_name text,
  score_a int,
  score_b int,
  played boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;

  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  return query
  select g.id, g.round, g.date, ta.name, tb.name, g.score_a, g.score_b, g.played
  from public.games g
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.championship_id = v_championship_id
  order by g.date asc nulls last, g.round asc;
end;
$$;

revoke all on function public.sumula_list_games(uuid) from public;
grant execute on function public.sumula_list_games(uuid) to anon, authenticated;

create or replace function public.sumula_get_game(p_token uuid, p_game_id uuid)
returns table (
  game_id uuid,
  championship_id uuid,
  round text,
  team_a_id uuid,
  team_a_name text,
  team_b_id uuid,
  team_b_name text,
  score_a int,
  score_b int,
  played boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;

  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  return query
  select g.id, g.championship_id, g.round, g.team_a_id, ta.name, g.team_b_id, tb.name, g.score_a, g.score_b, g.played
  from public.games g
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.id = p_game_id and g.championship_id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_game(uuid, uuid) from public;
grant execute on function public.sumula_get_game(uuid, uuid) to anon, authenticated;

create or replace function public.sumula_add_goal(p_token uuid, p_game_id uuid, p_player_id uuid, p_minute int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game record;
  v_player_team uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;
  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  select id, team_a_id, team_b_id into v_game
  from public.games
  where id = p_game_id and championship_id = v_championship_id;
  if v_game.id is null then
    raise exception 'Jogo não encontrado.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team not in (v_game.team_a_id, v_game.team_b_id) then
    raise exception 'O jogador selecionado não faz parte de nenhum dos times deste jogo.';
  end if;

  insert into public.goal_events (championship_id, game_id, player_id, minute)
  values (v_championship_id, v_game.id, p_player_id, p_minute);

  perform public.process_game_ovr(v_game.id);
end;
$$;

revoke all on function public.sumula_add_goal(uuid, uuid, uuid, int) from public;
grant execute on function public.sumula_add_goal(uuid, uuid, uuid, int) to anon, authenticated;

create or replace function public.sumula_delete_goal(p_token uuid, p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;
  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  select game_id into v_game_id
  from public.goal_events
  where id = p_goal_id and championship_id = v_championship_id;
  if v_game_id is null then
    raise exception 'Gol não encontrado.';
  end if;

  delete from public.goal_events where id = p_goal_id;
  perform public.process_game_ovr(v_game_id);
end;
$$;

revoke all on function public.sumula_delete_goal(uuid, uuid) from public;
grant execute on function public.sumula_delete_goal(uuid, uuid) to anon, authenticated;

create or replace function public.sumula_add_card(p_token uuid, p_game_id uuid, p_player_id uuid, p_card_type text, p_minute int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game record;
  v_player_team uuid;
begin
  if p_card_type not in ('yellow', 'red') then
    raise exception 'Tipo de cartão inválido.';
  end if;

  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;
  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  select id, team_a_id, team_b_id into v_game
  from public.games
  where id = p_game_id and championship_id = v_championship_id;
  if v_game.id is null then
    raise exception 'Jogo não encontrado.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team not in (v_game.team_a_id, v_game.team_b_id) then
    raise exception 'O jogador selecionado não faz parte de nenhum dos times deste jogo.';
  end if;

  insert into public.card_events (championship_id, game_id, player_id, card_type, minute)
  values (v_championship_id, v_game.id, p_player_id, p_card_type, p_minute);

  perform public.process_game_ovr(v_game.id);
end;
$$;

revoke all on function public.sumula_add_card(uuid, uuid, uuid, text, int) from public;
grant execute on function public.sumula_add_card(uuid, uuid, uuid, text, int) to anon, authenticated;

create or replace function public.sumula_delete_card(p_token uuid, p_card_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;
  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  select game_id into v_game_id
  from public.card_events
  where id = p_card_id and championship_id = v_championship_id;
  if v_game_id is null then
    raise exception 'Cartão não encontrado.';
  end if;

  delete from public.card_events where id = p_card_id;
  perform public.process_game_ovr(v_game_id);
end;
$$;

revoke all on function public.sumula_delete_card(uuid, uuid) from public;
grant execute on function public.sumula_delete_card(uuid, uuid) to anon, authenticated;

create or replace function public.sumula_set_played(p_token uuid, p_game_id uuid, p_played boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;
  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  select id into v_game_id
  from public.games
  where id = p_game_id and championship_id = v_championship_id;
  if v_game_id is null then
    raise exception 'Jogo não encontrado.';
  end if;

  update public.games set played = p_played where id = v_game_id;
  perform public.process_game_ovr(v_game_id);
end;
$$;

revoke all on function public.sumula_set_played(uuid, uuid, boolean) from public;
grant execute on function public.sumula_set_played(uuid, uuid, boolean) to anon, authenticated;
