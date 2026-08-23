-- Vitória por W.O.: o admin (ou o mesário pelo link público) escolhe o
-- time vencedor e o jogo é decidido 3x0 para esse time, sem lançar gol
-- para nenhum jogador — os gols individuais continuam vindo só de
-- goal_events, que fica vazio nesse caso.
--
-- games.walkover_team_id guarda o time vencedor por W.O. (null = jogo
-- normal, placar derivado da contagem de goal_events como antes). Isso
-- precisa entrar dentro do próprio process_game_ovr (e não só como um
-- update pontual em score_a/score_b), porque ele já recalcula o placar
-- a partir de goal_events toda vez que roda (qualquer gol/cartão
-- lançado depois, ou um toggle de "realizado") — sem esse branch o
-- placar do W.O. seria zerado de novo no próximo recalculo.

alter table public.games
  add column if not exists walkover_team_id uuid references public.teams(id) on delete set null;

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
  select id, championship_id, team_a_id, team_b_id, played, round, walkover_team_id
    into v_game
  from public.games
  where id = p_game_id;

  if v_game.id is null then
    return;
  end if;

  if v_game.walkover_team_id is not null then
    v_score_a := case when v_game.walkover_team_id = v_game.team_a_id then 3 else 0 end;
    v_score_b := case when v_game.walkover_team_id = v_game.team_b_id then 3 else 0 end;
  else
    select count(*) into v_score_a
    from public.goal_events ge
    join public.players p on p.id = ge.player_id
    where ge.game_id = p_game_id and p.team_id = v_game.team_a_id;

    select count(*) into v_score_b
    from public.goal_events ge
    join public.players p on p.id = ge.player_id
    where ge.game_id = p_game_id and p.team_id = v_game.team_b_id;
  end if;

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

-- RPC pública (link de súmula por token): define ou limpa o vencedor por
-- W.O. Definir um vencedor força played = true (o jogo fica decidido na
-- hora); limpar (null) só remove o override e deixa o placar voltar a
-- ser o de goal_events, sem mexer em played.
create or replace function public.sumula_set_walkover(p_token uuid, p_game_id uuid, p_winner_team_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game record;
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

  if p_winner_team_id is not null and p_winner_team_id not in (v_game.team_a_id, v_game.team_b_id) then
    raise exception 'O time vencedor do W.O. precisa ser um dos times deste jogo.';
  end if;

  update public.games
  set walkover_team_id = p_winner_team_id,
      played = case when p_winner_team_id is not null then true else played end
  where id = v_game.id;

  perform public.process_game_ovr(v_game.id);
end;
$$;

revoke all on function public.sumula_set_walkover(uuid, uuid, uuid) from public;
grant execute on function public.sumula_set_walkover(uuid, uuid, uuid) to anon, authenticated;

-- sumula_get_game precisa devolver walkover_team_id também, para o link
-- público mostrar o seletor de W.O. já com o valor atual selecionado.
drop function if exists public.sumula_get_game(uuid, uuid);

create function public.sumula_get_game(p_token uuid, p_game_id uuid)
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
  penalty_score_a int,
  penalty_score_b int,
  played boolean,
  walkover_team_id uuid
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
  select
    g.id, g.championship_id, g.round, g.team_a_id, ta.name, g.team_b_id, tb.name,
    g.score_a, g.score_b, g.penalty_score_a, g.penalty_score_b, g.played, g.walkover_team_id
  from public.games g
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.id = p_game_id and g.championship_id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_game(uuid, uuid) from public;
grant execute on function public.sumula_get_game(uuid, uuid) to anon, authenticated;
