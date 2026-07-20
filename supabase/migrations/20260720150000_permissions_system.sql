-- ============================================================
-- Sistema de permissões granulares: além de admin (acesso total),
-- outros usuários podem receber permissões específicas e globais
-- (valem em qualquer campeonato): manage_championships,
-- manage_teams_games, manage_finance, manage_sponsors.
-- ============================================================
create table if not exists public.user_permissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null check (
    permission in ('manage_championships', 'manage_teams_games', 'manage_finance', 'manage_sponsors')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, permission)
);

alter table public.user_permissions enable row level security;

create policy "user_permissions_select_admin_or_self" on public.user_permissions
  for select using (is_admin() or user_id = (select auth.uid()));

create policy "user_permissions_insert_admin" on public.user_permissions
  for insert with check (is_admin());

create policy "user_permissions_delete_admin" on public.user_permissions
  for delete using (is_admin());

create or replace function public.has_permission(p_permission text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select is_admin() or exists (
    select 1 from public.user_permissions up
    where up.user_id = (select auth.uid()) and up.permission = p_permission
  );
$$;

revoke all on function public.has_permission(text) from public;
revoke execute on function public.has_permission(text) from anon;
grant execute on function public.has_permission(text) to authenticated;

create or replace function public.can_manage_championships(p_championship_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_championship_admin(p_championship_id) or has_permission('manage_championships');
$$;

create or replace function public.can_manage_teams_games(p_championship_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_championship_admin(p_championship_id) or has_permission('manage_teams_games');
$$;

create or replace function public.can_manage_finance(p_championship_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_championship_admin(p_championship_id) or has_permission('manage_finance');
$$;

create or replace function public.can_manage_sponsors(p_championship_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select is_championship_admin(p_championship_id) or has_permission('manage_sponsors');
$$;

revoke all on function public.can_manage_championships(uuid) from public;
revoke all on function public.can_manage_teams_games(uuid) from public;
revoke all on function public.can_manage_finance(uuid) from public;
revoke all on function public.can_manage_sponsors(uuid) from public;
revoke execute on function public.can_manage_championships(uuid) from anon;
revoke execute on function public.can_manage_teams_games(uuid) from anon;
revoke execute on function public.can_manage_finance(uuid) from anon;
revoke execute on function public.can_manage_sponsors(uuid) from anon;
grant execute on function public.can_manage_championships(uuid) to authenticated;
grant execute on function public.can_manage_teams_games(uuid) to authenticated;
grant execute on function public.can_manage_finance(uuid) to authenticated;
grant execute on function public.can_manage_sponsors(uuid) to authenticated;

-- ============================================================
-- championships: manage_championships
-- ============================================================
drop policy if exists "championships_insert_admin" on public.championships;
create policy "championships_insert_admin" on public.championships
  for insert with check (
    (is_admin() or has_permission('manage_championships'))
    and (owner_id = (select auth.uid()))
  );

drop policy if exists "championships_update_admin" on public.championships;
create policy "championships_update_admin" on public.championships
  for update
  using (can_manage_championships(id))
  with check (can_manage_championships(id));

drop policy if exists "championships_delete_admin" on public.championships;
create policy "championships_delete_admin" on public.championships
  for delete using (can_manage_championships(id));

-- ============================================================
-- teams / players / coaches / games / referees / venues /
-- goal_events / card_events / game_lineups / game_captain_signatures:
-- manage_teams_games
-- ============================================================
drop policy if exists "teams_insert_admin" on public.teams;
create policy "teams_insert_admin" on public.teams
  for insert with check (can_manage_teams_games(championship_id));

drop policy if exists "teams_update_admin_or_owner" on public.teams;
create policy "teams_update_admin_or_owner" on public.teams
  for update
  using (can_manage_teams_games(championship_id) or (owner_user_id = (select auth.uid())))
  with check (can_manage_teams_games(championship_id) or (owner_user_id = (select auth.uid())));

drop policy if exists "teams_delete_admin" on public.teams;
create policy "teams_delete_admin" on public.teams
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "players_insert_admin_or_owner" on public.players;
create policy "players_insert_admin_or_owner" on public.players
  for insert with check (
    (can_manage_teams_games(championship_id) and (
      (team_id is null) or exists (
        select 1 from public.teams t where t.id = players.team_id and t.championship_id = players.championship_id
      )
    ))
    or (
      (team_id is not null) and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = (select auth.uid())
          and t.championship_id = players.championship_id
      )
    )
  );

drop policy if exists "players_update_admin_or_owner" on public.players;
create policy "players_update_admin_or_owner" on public.players
  for update
  using (
    can_manage_teams_games(championship_id)
    or ((team_id is not null) and exists (
      select 1 from public.teams t where t.id = players.team_id and t.owner_user_id = (select auth.uid())
    ))
  )
  with check (
    (can_manage_teams_games(championship_id) and (
      (team_id is null) or exists (
        select 1 from public.teams t where t.id = players.team_id and t.championship_id = players.championship_id
      )
    ))
    or (
      (team_id is not null) and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = (select auth.uid())
          and t.championship_id = players.championship_id
      )
    )
  );

drop policy if exists "players_delete_admin_or_owner" on public.players;
create policy "players_delete_admin_or_owner" on public.players
  for delete using (
    can_manage_teams_games(championship_id)
    or ((team_id is not null) and exists (
      select 1 from public.teams t where t.id = players.team_id and t.owner_user_id = (select auth.uid())
    ))
  );

drop policy if exists "coaches_insert_admin" on public.coaches;
create policy "coaches_insert_admin" on public.coaches
  for insert with check (can_manage_teams_games(championship_id));

drop policy if exists "coaches_update_admin" on public.coaches;
create policy "coaches_update_admin" on public.coaches
  for update using (can_manage_teams_games(championship_id)) with check (can_manage_teams_games(championship_id));

drop policy if exists "coaches_delete_admin" on public.coaches;
create policy "coaches_delete_admin" on public.coaches
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "games_insert_admin" on public.games;
create policy "games_insert_admin" on public.games
  for insert with check (can_manage_teams_games(championship_id));

drop policy if exists "games_update_admin" on public.games;
create policy "games_update_admin" on public.games
  for update using (can_manage_teams_games(championship_id)) with check (can_manage_teams_games(championship_id));

drop policy if exists "games_delete_admin" on public.games;
create policy "games_delete_admin" on public.games
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "referees_select_admin" on public.referees;
create policy "referees_select_admin" on public.referees
  for select using (can_manage_teams_games(championship_id));

drop policy if exists "referees_insert_admin" on public.referees;
create policy "referees_insert_admin" on public.referees
  for insert with check (can_manage_teams_games(championship_id));

drop policy if exists "referees_update_admin" on public.referees;
create policy "referees_update_admin" on public.referees
  for update using (can_manage_teams_games(championship_id)) with check (can_manage_teams_games(championship_id));

drop policy if exists "referees_delete_admin" on public.referees;
create policy "referees_delete_admin" on public.referees
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "venues_insert_admin" on public.venues;
create policy "venues_insert_admin" on public.venues
  for insert with check (can_manage_teams_games(championship_id));

drop policy if exists "venues_update_admin" on public.venues;
create policy "venues_update_admin" on public.venues
  for update using (can_manage_teams_games(championship_id)) with check (can_manage_teams_games(championship_id));

drop policy if exists "venues_delete_admin" on public.venues;
create policy "venues_delete_admin" on public.venues
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "goal_events_insert_admin" on public.goal_events;
create policy "goal_events_insert_admin" on public.goal_events
  for insert with check (
    can_manage_teams_games(championship_id)
    and exists (select 1 from public.games g where g.id = goal_events.game_id and g.championship_id = goal_events.championship_id)
  );

drop policy if exists "goal_events_update_admin" on public.goal_events;
create policy "goal_events_update_admin" on public.goal_events
  for update
  using (can_manage_teams_games(championship_id))
  with check (
    can_manage_teams_games(championship_id)
    and exists (select 1 from public.games g where g.id = goal_events.game_id and g.championship_id = goal_events.championship_id)
  );

drop policy if exists "goal_events_delete_admin" on public.goal_events;
create policy "goal_events_delete_admin" on public.goal_events
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "card_events_insert_admin" on public.card_events;
create policy "card_events_insert_admin" on public.card_events
  for insert with check (
    can_manage_teams_games(championship_id)
    and exists (select 1 from public.games g where g.id = card_events.game_id and g.championship_id = card_events.championship_id)
  );

drop policy if exists "card_events_update_admin" on public.card_events;
create policy "card_events_update_admin" on public.card_events
  for update
  using (can_manage_teams_games(championship_id))
  with check (
    can_manage_teams_games(championship_id)
    and exists (select 1 from public.games g where g.id = card_events.game_id and g.championship_id = card_events.championship_id)
  );

drop policy if exists "card_events_delete_admin" on public.card_events;
create policy "card_events_delete_admin" on public.card_events
  for delete using (can_manage_teams_games(championship_id));

drop policy if exists "game_lineups_write_admin" on public.game_lineups;
create policy "game_lineups_write_admin" on public.game_lineups
  for all
  using (can_manage_teams_games(championship_id))
  with check (
    can_manage_teams_games(championship_id)
    and exists (select 1 from public.games g where g.id = game_lineups.game_id and g.championship_id = game_lineups.championship_id)
  );

drop policy if exists "game_captain_signatures_write_admin" on public.game_captain_signatures;
create policy "game_captain_signatures_write_admin" on public.game_captain_signatures
  for all
  using (can_manage_teams_games(championship_id))
  with check (
    can_manage_teams_games(championship_id)
    and exists (
      select 1 from public.games g
      where g.id = game_captain_signatures.game_id
        and g.championship_id = game_captain_signatures.championship_id
        and (game_captain_signatures.team_id = g.team_a_id or game_captain_signatures.team_id = g.team_b_id)
    )
  );

-- ============================================================
-- financial_entries: manage_finance
-- ============================================================
drop policy if exists "financial_entries_select_admin" on public.financial_entries;
create policy "financial_entries_select_admin" on public.financial_entries
  for select using (can_manage_finance(financial_entries.championship_id));

drop policy if exists "financial_entries_insert_admin" on public.financial_entries;
create policy "financial_entries_insert_admin" on public.financial_entries
  for insert with check (can_manage_finance(financial_entries.championship_id));

drop policy if exists "financial_entries_update_admin" on public.financial_entries;
create policy "financial_entries_update_admin" on public.financial_entries
  for update
  using (can_manage_finance(financial_entries.championship_id))
  with check (can_manage_finance(financial_entries.championship_id));

drop policy if exists "financial_entries_delete_admin" on public.financial_entries;
create policy "financial_entries_delete_admin" on public.financial_entries
  for delete using (can_manage_finance(financial_entries.championship_id));

-- ============================================================
-- sponsors: manage_sponsors
-- ============================================================
drop policy if exists "sponsors_insert_admin" on public.sponsors;
create policy "sponsors_insert_admin" on public.sponsors
  for insert with check (can_manage_sponsors(championship_id));

drop policy if exists "sponsors_update_admin" on public.sponsors;
create policy "sponsors_update_admin" on public.sponsors
  for update using (can_manage_sponsors(championship_id)) with check (can_manage_sponsors(championship_id));

drop policy if exists "sponsors_delete_admin" on public.sponsors;
create policy "sponsors_delete_admin" on public.sponsors
  for delete using (can_manage_sponsors(championship_id));

-- ============================================================
-- storage: championship-logos (manage_championships), crests /
-- player-photos (manage_teams_games), sponsor-logos (manage_sponsors)
-- ============================================================
drop policy if exists "championship_logos_select_admin" on storage.objects;
create policy "championship_logos_select_admin" on storage.objects
  for select using (
    bucket_id = 'championship-logos'
    and can_manage_championships(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "championship_logos_insert_admin" on storage.objects;
create policy "championship_logos_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'championship-logos'
    and can_manage_championships(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "championship_logos_update_admin" on storage.objects;
create policy "championship_logos_update_admin" on storage.objects
  for update using (
    bucket_id = 'championship-logos'
    and can_manage_championships(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "championship_logos_delete_admin" on storage.objects;
create policy "championship_logos_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'championship-logos'
    and can_manage_championships(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "crests_select_admin" on storage.objects;
create policy "crests_select_admin" on storage.objects
  for select using (
    bucket_id = 'crests' and (is_admin() or has_permission('manage_teams_games'))
  );

drop policy if exists "crests_insert_admin" on storage.objects;
create policy "crests_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'crests'
    and can_manage_teams_games((select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "crests_update_admin" on storage.objects;
create policy "crests_update_admin" on storage.objects
  for update using (
    bucket_id = 'crests'
    and can_manage_teams_games((select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "crests_delete_admin" on storage.objects;
create policy "crests_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'crests'
    and can_manage_teams_games((select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "player_photos_select_admin" on storage.objects;
create policy "player_photos_select_admin" on storage.objects
  for select using (
    bucket_id = 'player-photos' and (is_admin() or has_permission('manage_teams_games'))
  );

drop policy if exists "player_photos_insert_admin" on storage.objects;
create policy "player_photos_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'player-photos'
    and can_manage_teams_games((select p.championship_id from public.players p where p.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "player_photos_update_admin" on storage.objects;
create policy "player_photos_update_admin" on storage.objects
  for update using (
    bucket_id = 'player-photos'
    and can_manage_teams_games((select p.championship_id from public.players p where p.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "player_photos_delete_admin" on storage.objects;
create policy "player_photos_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'player-photos'
    and can_manage_teams_games((select p.championship_id from public.players p where p.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "sponsor_logos_select_admin" on storage.objects;
create policy "sponsor_logos_select_admin" on storage.objects
  for select using (
    bucket_id = 'sponsor-logos'
    and can_manage_sponsors((select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "sponsor_logos_insert_admin" on storage.objects;
create policy "sponsor_logos_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'sponsor-logos'
    and can_manage_sponsors((select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "sponsor_logos_update_admin" on storage.objects;
create policy "sponsor_logos_update_admin" on storage.objects
  for update using (
    bucket_id = 'sponsor-logos'
    and can_manage_sponsors((select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid))
  );

drop policy if exists "sponsor_logos_delete_admin" on storage.objects;
create policy "sponsor_logos_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'sponsor-logos'
    and can_manage_sponsors((select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid))
  );

-- ============================================================
-- admin_set_user_admin(): trava para conceder/revogar o cargo de
-- admin com segurança — nunca zera todos os admins do sistema, e
-- ninguém pode remover o próprio cargo (evita se travar sozinho).
-- ============================================================
create or replace function public.admin_set_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Sem permissão para alterar cargos de administrador.';
  end if;

  if p_user_id = (select auth.uid()) and not p_is_admin then
    raise exception 'Você não pode remover seu próprio cargo de administrador.';
  end if;

  if p_is_admin then
    insert into public.user_roles (user_id, role)
    values (p_user_id, 'admin')
    on conflict (user_id) do update set role = 'admin';
  else
    if (select count(*) from public.user_roles where role = 'admin') <= 1 then
      raise exception 'Não é possível remover o último administrador do sistema.';
    end if;
    delete from public.user_roles where user_id = p_user_id and role = 'admin';
  end if;
end;
$$;

revoke all on function public.admin_set_user_admin(uuid, boolean) from public;
revoke execute on function public.admin_set_user_admin(uuid, boolean) from anon;
grant execute on function public.admin_set_user_admin(uuid, boolean) to authenticated;

-- ============================================================
-- admin_set_user_permission(): concede/revoga uma permissão
-- específica de um usuário (só quem já é admin pode chamar).
-- ============================================================
create or replace function public.admin_set_user_permission(
  p_user_id uuid,
  p_permission text,
  p_granted boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not is_admin() then
    raise exception 'Sem permissão para alterar permissões de usuários.';
  end if;

  if p_permission not in ('manage_championships', 'manage_teams_games', 'manage_finance', 'manage_sponsors') then
    raise exception 'Permissão inválida.';
  end if;

  if p_granted then
    insert into public.user_permissions (user_id, permission)
    values (p_user_id, p_permission)
    on conflict (user_id, permission) do nothing;
  else
    delete from public.user_permissions
    where user_id = p_user_id and permission = p_permission;
  end if;
end;
$$;

revoke all on function public.admin_set_user_permission(uuid, text, boolean) from public;
revoke execute on function public.admin_set_user_permission(uuid, text, boolean) from anon;
grant execute on function public.admin_set_user_permission(uuid, text, boolean) to authenticated;
