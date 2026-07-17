-- ============================================================
-- Documento do jogador (CPF ou RG).
-- ============================================================
alter table public.players
  add column if not exists document_type text,
  add column if not exists document_number text;

alter table public.players
  add constraint players_document_type_check
    check (document_type is null or document_type in ('cpf', 'rg'));

-- ============================================================
-- Remove Lateral/Volante do conjunto de posições válidas — dobra o que
-- já existia em Zagueiro/Meia (essas duas posições já eram excluídas da
-- formação do Time da Rodada, ver src/lib/team-of-the-round.ts).
-- ============================================================
update public.players set position = 'Zagueiro' where position = 'Lateral';
update public.players set position = 'Meia' where position = 'Volante';

-- ============================================================
-- Atributos iniciais por posição (perfil tático), substituindo o 70
-- fixo para todo mundo. OVR = média dos 6 atributos.
-- Atacante: PAC 78 / SHO 78 / PAS 62 / DRI 78 / DEF 35 / PHY 68
-- Meia:     PAC 72 / SHO 68 / PAS 78 / DRI 76 / DEF 60 / PHY 66
-- Zagueiro: PAC 65 / SHO 45 / PAS 58 / DRI 60 / DEF 77 / PHY 79
-- Goleiro:  PAC 50 / SHO 30 / PAS 65 / DRI 45 / DEF 78 / PHY 78
-- Qualquer posição não reconhecida cai no perfil de Meia, seguindo o
-- mesmo fallback já usado em process_game_ovr.
-- ============================================================
create or replace function public.base_attributes_for_position(p_position text)
returns table (
  ovr numeric,
  ritmo numeric,
  finalizacao numeric,
  passe numeric,
  drible numeric,
  defesa numeric,
  fisico numeric
)
language sql
immutable
set search_path = public
as $$
  select
    round2((r + f + pa + d + de + fi) / 6.0) as ovr,
    r as ritmo, f as finalizacao, pa as passe, d as drible, de as defesa, fi as fisico
  from (
    select
      (case p_position when 'Atacante' then 78 when 'Zagueiro' then 65 when 'Goleiro' then 50 else 72 end)::numeric as r,
      (case p_position when 'Atacante' then 78 when 'Zagueiro' then 45 when 'Goleiro' then 30 else 68 end)::numeric as f,
      (case p_position when 'Atacante' then 62 when 'Zagueiro' then 58 when 'Goleiro' then 65 else 78 end)::numeric as pa,
      (case p_position when 'Atacante' then 78 when 'Zagueiro' then 60 when 'Goleiro' then 45 else 76 end)::numeric as d,
      (case p_position when 'Atacante' then 35 when 'Zagueiro' then 77 when 'Goleiro' then 78 else 60 end)::numeric as de,
      (case p_position when 'Atacante' then 68 when 'Zagueiro' then 79 when 'Goleiro' then 78 else 66 end)::numeric as fi
  ) t;
$$;

-- Novo jogador: atributos iniciais já nascem no perfil da posição.
create or replace function public.handle_new_player()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_base record;
begin
  select * into v_base from public.base_attributes_for_position(new.position);
  insert into public.player_attributes (player_id, ovr, ritmo, finalizacao, passe, drible, defesa, fisico)
  values (new.id, v_base.ovr, v_base.ritmo, v_base.finalizacao, v_base.passe, v_base.drible, v_base.defesa, v_base.fisico)
  on conflict (player_id) do nothing;
  return new;
end;
$$;

-- Jogadores já cadastrados: troca a base fixa (70) pela base por posição,
-- preservando o que já tiver sido ganho/perdido em jogos (delta = valor
-- atual − 70, aplicado por cima da nova base, um atributo de cada vez).
update public.player_attributes pa
set
  ovr = least(99, greatest(0, round2(base.ovr + (pa.ovr - 70)))),
  ritmo = least(99, greatest(0, round2(base.ritmo + (pa.ritmo - 70)))),
  finalizacao = least(99, greatest(0, round2(base.finalizacao + (pa.finalizacao - 70)))),
  passe = least(99, greatest(0, round2(base.passe + (pa.passe - 70)))),
  drible = least(99, greatest(0, round2(base.drible + (pa.drible - 70)))),
  defesa = least(99, greatest(0, round2(base.defesa + (pa.defesa - 70)))),
  fisico = least(99, greatest(0, round2(base.fisico + (pa.fisico - 70)))),
  updated_at = now()
from public.players p
cross join lateral public.base_attributes_for_position(p.position) as base
where pa.player_id = p.id;

-- process_game_ovr também normalizava para as 6 posições antigas —
-- restringe para as 4 atuais (mesmo fallback: não reconhecida vira Meia).
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
