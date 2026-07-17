-- ============================================================
-- Súmula Digital: painel por jogo (gols, cartões, placar final)
-- + link público para mesários preencherem ao vivo, sem login.
--
-- O token NÃO fica em uma coluna de `games` porque essa tabela tem
-- select using (true) (leitura pública) — qualquer coluna ali é
-- visível via REST direto com a anon key, independente do que as
-- telas do app pedem. Uma tabela separada, sem nenhuma policy de
-- select, garante que o token só circula por dentro das funções
-- abaixo (SECURITY DEFINER), nunca por uma leitura direta da tabela.
-- ============================================================
create table public.game_sumula_tokens (
  game_id uuid primary key references public.games(id) on delete cascade,
  token uuid not null unique default gen_random_uuid()
);
alter table public.game_sumula_tokens enable row level security;
-- Nenhuma policy: só acessível via funções SECURITY DEFINER abaixo.

-- ============================================================
-- round2: replica Math.round(x*100)/100 do TS (arredonda .5 sempre
-- para cima, inclusive negativos) — round()/numeric do Postgres
-- arredonda .5 para longe do zero, o que diverge nos cálculos de
-- impacto defensivo (zagueiro/goleiro), que caem exatamente em
-- meio-centavo com qualquer número de gols sofridos.
-- ============================================================
create or replace function public.round2(x numeric)
returns numeric
language sql
immutable
set search_path = public
as $$
  select floor(x * 100 + 0.5) / 100;
$$;

-- ============================================================
-- process_game_ovr: porte em SQL do antigo
-- src/app/campeonatos/[id]/jogos/ovr-processing.ts, para que o mesmo
-- motor sirva tanto o fluxo do admin quanto o link público de súmula
-- (SECURITY DEFINER, sem precisar de service role key). Idempotente:
-- desfaz o lançamento anterior daquele jogo e recalcula do zero.
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
  select id, championship_id, team_a_id, team_b_id, score_a, score_b, played, round
    into v_game
  from public.games
  where id = p_game_id;

  if v_game.id is null then
    return;
  end if;

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

  if not v_game.played or v_game.score_a is null or v_game.score_b is null then
    update public.games set mvp_player_id = null, ovr_processed_at = null where id = p_game_id;
    return;
  end if;

  v_winner_team_id := case
    when v_game.score_a > v_game.score_b then v_game.team_a_id
    when v_game.score_b > v_game.score_a then v_game.team_b_id
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
    v_goals_conceded := case when v_player.team_id = v_game.team_a_id then v_game.score_b else v_game.score_a end;
    v_position := v_player.position;
    if v_position is null or v_position not in ('Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante') then
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
-- Admin: gerar/consultar e regenerar o link da súmula (exige ser
-- admin do campeonato do jogo).
-- ============================================================
create or replace function public.get_or_create_sumula_token(p_game_id uuid, p_championship_id uuid)
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
  if not exists (select 1 from public.games where id = p_game_id and championship_id = p_championship_id) then
    raise exception 'Jogo não encontrado.';
  end if;

  insert into public.game_sumula_tokens (game_id)
  values (p_game_id)
  on conflict (game_id) do nothing;

  select token into v_token from public.game_sumula_tokens where game_id = p_game_id;
  return v_token;
end;
$$;

revoke all on function public.get_or_create_sumula_token(uuid, uuid) from public;
grant execute on function public.get_or_create_sumula_token(uuid, uuid) to authenticated;

create or replace function public.regenerate_sumula_token(p_game_id uuid, p_championship_id uuid)
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
  if not exists (select 1 from public.games where id = p_game_id and championship_id = p_championship_id) then
    raise exception 'Jogo não encontrado.';
  end if;

  insert into public.game_sumula_tokens (game_id, token)
  values (p_game_id, v_token)
  on conflict (game_id) do update set token = v_token;

  return v_token;
end;
$$;

revoke all on function public.regenerate_sumula_token(uuid, uuid) from public;
grant execute on function public.regenerate_sumula_token(uuid, uuid) to authenticated;

-- ============================================================
-- Mesário (sem login): resolver o token para os dados do jogo, e
-- lançar gols/cartões/placar. Cada função revalida o token contra
-- game_sumula_tokens antes de escrever; games/teams/players/eventos
-- já têm select público, então a leitura do restante do jogo não
-- precisa de função — só a resolução do token e as escritas.
-- ============================================================
create or replace function public.sumula_get_game(p_token uuid)
returns table (
  game_id uuid,
  championship_id uuid,
  championship_name text,
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
  v_game_id uuid;
begin
  select gst.game_id into v_game_id from public.game_sumula_tokens gst where gst.token = p_token;
  if v_game_id is null then
    raise exception 'Link inválido.';
  end if;

  return query
  select g.id, g.championship_id, c.name, g.round,
    g.team_a_id, ta.name, g.team_b_id, tb.name,
    g.score_a, g.score_b, g.played
  from public.games g
  join public.championships c on c.id = g.championship_id
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.id = v_game_id;
end;
$$;

revoke all on function public.sumula_get_game(uuid) from public;
grant execute on function public.sumula_get_game(uuid) to anon, authenticated;

create or replace function public.sumula_add_goal(p_token uuid, p_player_id uuid, p_minute int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game record;
  v_player_team uuid;
begin
  select g.id, g.championship_id, g.team_a_id, g.team_b_id
    into v_game
  from public.games g
  join public.game_sumula_tokens gst on gst.game_id = g.id
  where gst.token = p_token;

  if v_game.id is null then
    raise exception 'Link inválido.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team not in (v_game.team_a_id, v_game.team_b_id) then
    raise exception 'O jogador selecionado não faz parte de nenhum dos times deste jogo.';
  end if;

  insert into public.goal_events (championship_id, game_id, player_id, minute)
  values (v_game.championship_id, v_game.id, p_player_id, p_minute);

  perform public.process_game_ovr(v_game.id);
end;
$$;

revoke all on function public.sumula_add_goal(uuid, uuid, int) from public;
grant execute on function public.sumula_add_goal(uuid, uuid, int) to anon, authenticated;

create or replace function public.sumula_delete_goal(p_token uuid, p_goal_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select gst.game_id into v_game_id from public.game_sumula_tokens gst where gst.token = p_token;
  if v_game_id is null then
    raise exception 'Link inválido.';
  end if;

  delete from public.goal_events where id = p_goal_id and game_id = v_game_id;
  perform public.process_game_ovr(v_game_id);
end;
$$;

revoke all on function public.sumula_delete_goal(uuid, uuid) from public;
grant execute on function public.sumula_delete_goal(uuid, uuid) to anon, authenticated;

create or replace function public.sumula_add_card(p_token uuid, p_player_id uuid, p_card_type text, p_minute int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game record;
  v_player_team uuid;
begin
  if p_card_type not in ('yellow', 'red') then
    raise exception 'Tipo de cartão inválido.';
  end if;

  select g.id, g.championship_id, g.team_a_id, g.team_b_id
    into v_game
  from public.games g
  join public.game_sumula_tokens gst on gst.game_id = g.id
  where gst.token = p_token;

  if v_game.id is null then
    raise exception 'Link inválido.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team not in (v_game.team_a_id, v_game.team_b_id) then
    raise exception 'O jogador selecionado não faz parte de nenhum dos times deste jogo.';
  end if;

  insert into public.card_events (championship_id, game_id, player_id, card_type, minute)
  values (v_game.championship_id, v_game.id, p_player_id, p_card_type, p_minute);

  perform public.process_game_ovr(v_game.id);
end;
$$;

revoke all on function public.sumula_add_card(uuid, uuid, text, int) from public;
grant execute on function public.sumula_add_card(uuid, uuid, text, int) to anon, authenticated;

create or replace function public.sumula_delete_card(p_token uuid, p_card_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select gst.game_id into v_game_id from public.game_sumula_tokens gst where gst.token = p_token;
  if v_game_id is null then
    raise exception 'Link inválido.';
  end if;

  delete from public.card_events where id = p_card_id and game_id = v_game_id;
  perform public.process_game_ovr(v_game_id);
end;
$$;

revoke all on function public.sumula_delete_card(uuid, uuid) from public;
grant execute on function public.sumula_delete_card(uuid, uuid) to anon, authenticated;

create or replace function public.sumula_update_score(p_token uuid, p_score_a int, p_score_b int, p_played boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
begin
  select gst.game_id into v_game_id from public.game_sumula_tokens gst where gst.token = p_token;
  if v_game_id is null then
    raise exception 'Link inválido.';
  end if;

  if p_played and (p_score_a is null or p_score_b is null) then
    raise exception 'Informe o placar dos dois times para marcar o jogo como realizado.';
  end if;

  update public.games
  set score_a = p_score_a, score_b = p_score_b, played = p_played
  where id = v_game_id;

  perform public.process_game_ovr(v_game_id);
end;
$$;

revoke all on function public.sumula_update_score(uuid, int, int, boolean) from public;
grant execute on function public.sumula_update_score(uuid, int, int, boolean) to anon, authenticated;

-- Defense in depth: Supabase's default privileges grant EXECUTE on new
-- public functions to anon too. The two admin-only functions above already
-- reject anon internally (is_championship_admin() is always false without
-- an authenticated admin session), but revoke the grant explicitly so only
-- authenticated sessions can even attempt the call.
revoke execute on function public.get_or_create_sumula_token(uuid, uuid) from anon;
revoke execute on function public.regenerate_sumula_token(uuid, uuid) from anon;
