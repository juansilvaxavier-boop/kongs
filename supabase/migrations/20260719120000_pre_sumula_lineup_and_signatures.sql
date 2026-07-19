create table if not exists public.game_lineups (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, player_id)
);
create index if not exists idx_game_lineups_game on public.game_lineups(game_id);
alter table public.game_lineups enable row level security;
create policy "game_lineups_select_public" on public.game_lineups for select using (true);
create policy "game_lineups_write_admin" on public.game_lineups
  for all using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

create table if not exists public.game_captain_signatures (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  captain_name text not null,
  signature_data_url text not null,
  signed_at timestamptz not null default now(),
  unique (game_id, team_id)
);
create index if not exists idx_game_captain_signatures_game on public.game_captain_signatures(game_id);
alter table public.game_captain_signatures enable row level security;
create policy "game_captain_signatures_select_public" on public.game_captain_signatures for select using (true);
create policy "game_captain_signatures_write_admin" on public.game_captain_signatures
  for all using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

-- ============================================================
-- Mesário sem login (súmula pública por token): confirmar escalação
-- e coletar assinatura dos capitães na pré-súmula.
-- ============================================================
create or replace function public.sumula_toggle_lineup(
  p_token uuid,
  p_game_id uuid,
  p_player_id uuid,
  p_confirmed boolean
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

  if p_confirmed then
    insert into public.game_lineups (championship_id, game_id, player_id)
    values (v_championship_id, v_game.id, p_player_id)
    on conflict (game_id, player_id) do nothing;
  else
    delete from public.game_lineups where game_id = v_game.id and player_id = p_player_id;
  end if;
end;
$$;

revoke all on function public.sumula_toggle_lineup(uuid, uuid, uuid, boolean) from public;
grant execute on function public.sumula_toggle_lineup(uuid, uuid, uuid, boolean) to anon, authenticated;

create or replace function public.sumula_sign_captain(
  p_token uuid,
  p_game_id uuid,
  p_team_id uuid,
  p_captain_name text,
  p_signature_data_url text
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
  if coalesce(trim(p_captain_name), '') = '' then
    raise exception 'Informe o nome do capitão.';
  end if;
  if coalesce(trim(p_signature_data_url), '') = '' then
    raise exception 'Assinatura inválida.';
  end if;

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

  if p_team_id not in (v_game.team_a_id, v_game.team_b_id) then
    raise exception 'Time inválido para este jogo.';
  end if;

  insert into public.game_captain_signatures
    (championship_id, game_id, team_id, captain_name, signature_data_url, signed_at)
  values (v_championship_id, v_game.id, p_team_id, trim(p_captain_name), p_signature_data_url, now())
  on conflict (game_id, team_id) do update
    set captain_name = excluded.captain_name,
        signature_data_url = excluded.signature_data_url,
        signed_at = excluded.signed_at;
end;
$$;

revoke all on function public.sumula_sign_captain(uuid, uuid, uuid, text, text) from public;
grant execute on function public.sumula_sign_captain(uuid, uuid, uuid, text, text) to anon, authenticated;
