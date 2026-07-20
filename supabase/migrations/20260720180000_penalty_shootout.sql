-- ============================================================
-- Disputa de pênaltis: quando um jogo de mata-mata termina
-- empatado, o mesário registra o placar da disputa de pênaltis
-- para desempatar (não conta como gol/estatística — é só o
-- desempate do confronto).
-- ============================================================
alter table public.games
  add column if not exists penalty_score_a int check (penalty_score_a >= 0),
  add column if not exists penalty_score_b int check (penalty_score_b >= 0);

alter table public.games drop constraint if exists games_penalty_score_no_tie;
alter table public.games add constraint games_penalty_score_no_tie
  check (penalty_score_a is null or penalty_score_b is null or penalty_score_a <> penalty_score_b);

create or replace function public.sumula_set_penalty_score(
  p_token uuid,
  p_game_id uuid,
  p_penalty_score_a int,
  p_penalty_score_b int
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_game_id uuid;
  v_score_a int;
  v_score_b int;
  v_played boolean;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;
  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  select id, score_a, score_b, played into v_game_id, v_score_a, v_score_b, v_played
  from public.games
  where id = p_game_id and championship_id = v_championship_id;
  if v_game_id is null then
    raise exception 'Jogo não encontrado.';
  end if;

  if p_penalty_score_a is not null or p_penalty_score_b is not null then
    if not v_played then
      raise exception 'Marque o jogo como realizado antes de lançar os pênaltis.';
    end if;
    if v_score_a is distinct from v_score_b then
      raise exception 'Pênaltis só podem ser lançados quando o jogo termina empatado.';
    end if;
    if p_penalty_score_a = p_penalty_score_b then
      raise exception 'A disputa de pênaltis não pode terminar empatada.';
    end if;
  end if;

  update public.games
  set penalty_score_a = p_penalty_score_a, penalty_score_b = p_penalty_score_b
  where id = v_game_id;
end;
$$;

revoke all on function public.sumula_set_penalty_score(uuid, uuid, int, int) from public;
grant execute on function public.sumula_set_penalty_score(uuid, uuid, int, int) to anon, authenticated;
