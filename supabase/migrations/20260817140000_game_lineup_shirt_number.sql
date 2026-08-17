alter table public.game_lineups add column if not exists shirt_number integer;

-- ============================================================
-- Súmula pública por token: definir o número da camisa que o
-- jogador vai usar naquela partida (editável, mesmo já cadastrado).
-- ============================================================
create or replace function public.sumula_set_shirt_number(
  p_token uuid,
  p_game_id uuid,
  p_player_id uuid,
  p_shirt_number integer
)
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

  if p_shirt_number is not null and (p_shirt_number < 0 or p_shirt_number > 999) then
    raise exception 'Número de camisa inválido.';
  end if;

  insert into public.game_lineups (championship_id, game_id, player_id, shirt_number)
  values (v_championship_id, v_game.id, p_player_id, p_shirt_number)
  on conflict (game_id, player_id) do update
    set shirt_number = excluded.shirt_number;
end;
$$;

revoke all on function public.sumula_set_shirt_number(uuid, uuid, uuid, integer) from public;
grant execute on function public.sumula_set_shirt_number(uuid, uuid, uuid, integer) to anon, authenticated;
