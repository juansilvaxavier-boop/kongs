-- sumula_get_game() precisa devolver penalty_score_a/b também, para a
-- súmula pública mostrar/editar a disputa de pênaltis. Mudar o tipo de
-- retorno exige dropar antes (create or replace não permite).
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
  select
    g.id, g.championship_id, g.round, g.team_a_id, ta.name, g.team_b_id, tb.name,
    g.score_a, g.score_b, g.penalty_score_a, g.penalty_score_b, g.played
  from public.games g
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.id = p_game_id and g.championship_id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_game(uuid, uuid) from public;
grant execute on function public.sumula_get_game(uuid, uuid) to anon, authenticated;
