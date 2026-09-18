-- Súmula em PDF: cabeçalho reformulado (grade com Data/Horário/Fase e
-- Local/Cidade, feito pra destacar cada campo, no estilo de uma súmula
-- oficial em papel) e escudos dos times junto ao placar.
--
-- "Local do campeonato" (ex.: "Arena WR") é um dado fixo do campeonato,
-- diferente do "Local"/venue já existente por jogo (o campo específico
-- dentro do complexo, ex.: "Campo do Maquininha") — por isso vira coluna
-- própria em championships, não reaproveita a tabela de venues.
alter table public.championships
  add column if not exists arena_name text;

-- sumula_get_championship (rota pública/mesário) precisa devolver
-- arena_name também.
drop function if exists public.sumula_get_championship(uuid);

create function public.sumula_get_championship(p_token uuid)
returns table (
  championship_id uuid,
  championship_name text,
  edition text,
  city text,
  arena_name text,
  logo_url text
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
  select c.id, c.name, c.edition, c.city, c.arena_name, c.logo_url
  from public.championships c
  where c.id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_championship(uuid) from public;
grant execute on function public.sumula_get_championship(uuid) to anon, authenticated;

-- sumula_get_game precisa devolver o escudo de cada time também, para
-- o PDF da súmula (baixado pelo link público) mostrar os escudos junto
-- ao placar.
drop function if exists public.sumula_get_game(uuid, uuid);

create function public.sumula_get_game(p_token uuid, p_game_id uuid)
returns table (
  game_id uuid,
  championship_id uuid,
  round text,
  date timestamptz,
  team_a_id uuid,
  team_a_name text,
  team_a_crest_url text,
  team_b_id uuid,
  team_b_name text,
  team_b_crest_url text,
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
    g.id, g.championship_id, g.round, g.date, g.team_a_id, ta.name, ta.crest_url,
    g.team_b_id, tb.name, tb.crest_url,
    g.score_a, g.score_b, g.penalty_score_a, g.penalty_score_b, g.played, g.walkover_team_id
  from public.games g
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.id = p_game_id and g.championship_id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_game(uuid, uuid) from public;
grant execute on function public.sumula_get_game(uuid, uuid) to anon, authenticated;
