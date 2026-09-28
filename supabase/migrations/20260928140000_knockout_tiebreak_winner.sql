-- Em jogos de mata-mata que terminam empatados, além de lançar o
-- placar da disputa de pênaltis, o admin (ou o mesário pelo link
-- público) pode simplesmente escolher direto quem avança — sem
-- precisar inventar um placar de pênaltis pra isso. O placar real do
-- jogo (ex.: 1x1) continua registrado; só quem passa de fase fica
-- marcado à parte.
alter table public.games
  add column if not exists tiebreak_winner_team_id uuid references public.teams(id) on delete set null;

-- Admin já edita walkover_team_id com um update direto na tabela
-- (RLS libera pra admin do campeonato), então tiebreak_winner_team_id
-- segue o mesmo caminho — sem RPC dedicado pro admin. Só o fluxo
-- público (link da súmula, sem sessão autenticada) precisa de RPC.
create or replace function public.sumula_set_tiebreak_winner(
  p_token uuid,
  p_game_id uuid,
  p_winner_team_id uuid
)
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
    raise exception 'O time escolhido precisa ser um dos times deste jogo.';
  end if;

  update public.games set tiebreak_winner_team_id = p_winner_team_id where id = v_game.id;
end;
$$;

revoke all on function public.sumula_set_tiebreak_winner(uuid, uuid, uuid) from public;
grant execute on function public.sumula_set_tiebreak_winner(uuid, uuid, uuid) to anon, authenticated;

-- sumula_get_game precisa devolver tiebreak_winner_team_id também, pra
-- súmula pública mostrar o valor atual e o placar/vencedor do
-- chaveamento ficarem corretos mesmo sem pênaltis lançados.
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
  walkover_team_id uuid,
  tiebreak_winner_team_id uuid
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
    g.score_a, g.score_b, g.penalty_score_a, g.penalty_score_b, g.played, g.walkover_team_id,
    g.tiebreak_winner_team_id
  from public.games g
  join public.teams ta on ta.id = g.team_a_id
  join public.teams tb on tb.id = g.team_b_id
  where g.id = p_game_id and g.championship_id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_game(uuid, uuid) from public;
grant execute on function public.sumula_get_game(uuid, uuid) to anon, authenticated;
