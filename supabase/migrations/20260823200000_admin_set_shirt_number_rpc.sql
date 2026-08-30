-- setShirtNumber (admin) fazia um SELECT do "confirmed" atual seguido de
-- um upsert em dois passos client-side (insere-se-não-existir + update),
-- o que ainda deixava margem para inconsistência dependendo de timing e
-- não tinha a mesma garantia atômica de um único INSERT ... ON CONFLICT
-- DO UPDATE. A rota pública (sumula_set_shirt_number) já fazia isso do
-- jeito certo, num único statement, direto no banco. Este RPC replica
-- exatamente a mesma lógica pro admin, checando permissão de admin do
-- campeonato em vez de token.
create or replace function public.admin_set_game_lineup_shirt_number(
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
  v_team_a uuid;
  v_team_b uuid;
  v_player_team uuid;
begin
  select championship_id, team_a_id, team_b_id into v_championship_id, v_team_a, v_team_b
  from public.games
  where id = p_game_id;
  if v_championship_id is null then
    raise exception 'Jogo não encontrado.';
  end if;

  if not public.is_championship_admin(v_championship_id) then
    raise exception 'Sem permissão para editar este jogo.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team not in (v_team_a, v_team_b) then
    raise exception 'O jogador selecionado não faz parte de nenhum dos times deste jogo.';
  end if;

  if p_shirt_number is not null and (p_shirt_number < 0 or p_shirt_number > 999) then
    raise exception 'Número de camisa inválido.';
  end if;

  insert into public.game_lineups (championship_id, game_id, player_id, confirmed, shirt_number)
  values (v_championship_id, p_game_id, p_player_id, false, p_shirt_number)
  on conflict (game_id, player_id) do update
    set shirt_number = excluded.shirt_number;
end;
$$;

revoke all on function public.admin_set_game_lineup_shirt_number(uuid, uuid, integer) from public;
grant execute on function public.admin_set_game_lineup_shirt_number(uuid, uuid, integer) to authenticated;
