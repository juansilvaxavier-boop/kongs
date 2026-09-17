-- Muda os pesos de evolução de OVR por partida:
-- Gol: 0,30 -> 2,00 | Vitória: 0,20 -> 1,50 | Cartão amarelo: -0,15 -> -1,00
-- Cartão vermelho: -0,50 -> -2,00 | Impacto defensivo zagueiro: peso 0,15 -> 0,50
-- Impacto defensivo goleiro: peso 0,25 -> 0,70 (mesma fórmula (3,5 - gols
-- sofridos) * peso, só troca o peso).
--
-- Depois de trocar a função, reprocessa TODOS os jogos (não só os
-- futuros): como process_game_ovr desfaz o lançamento antigo daquele
-- jogo (via ovr_history) antes de aplicar o novo, rodar de novo pra cada
-- jogo já existente recalcula os atributos de todo mundo do zero com os
-- pesos novos, sem duplicar nem acumular em cima do que já tinha sido
-- ganho/perdido com os pesos antigos.
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
      v_delta := round2(v_goals * 2.00);
      v_reason := case when v_goals = 1 then '1 gol' else v_goals || ' gols' end;
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, v_reason, v_delta);
      v_total := v_total + v_delta;
      v_has_entries := true;
    end if;

    if v_player.team_id = v_winner_team_id then
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, 'Vitória', 1.50);
      v_total := v_total + 1.50;
      v_has_entries := true;
    end if;

    if v_yellow > 0 then
      v_delta := round2(-v_yellow * 1.00);
      v_reason := case when v_yellow = 1 then 'Cartão amarelo' else v_yellow || ' cartões amarelos' end;
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, v_reason, v_delta);
      v_total := v_total + v_delta;
      v_has_entries := true;
    end if;

    if v_red > 0 then
      v_delta := round2(-v_red * 2.00);
      v_reason := case when v_red = 1 then 'Cartão vermelho' else v_red || ' cartões vermelhos' end;
      insert into public.ovr_history (player_id, championship_id, game_id, round, reason, delta)
      values (v_player.id, v_game.championship_id, p_game_id, v_game.round, v_reason, v_delta);
      v_total := v_total + v_delta;
      v_has_entries := true;
    end if;

    if v_position in ('Zagueiro', 'Goleiro') then
      v_impact := round2((3.5 - v_goals_conceded) * (case when v_position = 'Zagueiro' then 0.50 else 0.70 end));
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

-- Reprocessa todo mundo com os pesos novos.
do $$
declare
  v_game_id uuid;
begin
  for v_game_id in select id from public.games loop
    perform public.process_game_ovr(v_game_id);
  end loop;
end;
$$;
