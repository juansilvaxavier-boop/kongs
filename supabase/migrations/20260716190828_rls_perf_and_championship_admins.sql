-- ============================================================
-- Co-organizadores por campeonato (base para múltiplos admins)
-- ============================================================
create table if not exists public.championship_admins (
  championship_id uuid not null references public.championships(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (championship_id, user_id)
);

alter table public.championship_admins enable row level security;

-- ============================================================
-- is_admin(): mesma lógica, só otimizando o auth.uid()
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

-- ============================================================
-- Função central: é admin (dono OU co-organizador) deste campeonato?
-- Substitui o padrão repetido "exists(select 1 from championships c
-- where c.id = X and c.owner_id = auth.uid() and is_admin())" em
-- todas as tabelas, e evita reavaliar auth.uid() linha a linha.
-- ============================================================
create or replace function public.is_championship_admin(p_championship_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.championships c
    where c.id = p_championship_id
      and c.owner_id = (select auth.uid())
      and public.is_admin()
  )
  or exists (
    select 1 from public.championship_admins ca
    where ca.championship_id = p_championship_id
      and ca.user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_championship_admin(uuid) from public;
grant execute on function public.is_championship_admin(uuid) to anon, authenticated;

-- ============================================================
-- championship_admins: só quem já administra o campeonato pode ver
-- (gestão de co-admins fica para uma iteração futura; por ora é só
-- a base de dados, populável via SQL)
-- ============================================================
create policy "championship_admins_select_admin" on public.championship_admins
  for select using (public.is_championship_admin(championship_id));

-- ============================================================
-- Reescreve as policies de escrita usando is_championship_admin()
-- ============================================================
drop policy if exists "championships_insert_admin" on public.championships;
drop policy if exists "championships_update_admin" on public.championships;
drop policy if exists "championships_delete_admin" on public.championships;

create policy "championships_insert_admin" on public.championships
  for insert with check (is_admin() and owner_id = (select auth.uid()));
create policy "championships_update_admin" on public.championships
  for update using (is_championship_admin(id))
  with check (is_championship_admin(id));
create policy "championships_delete_admin" on public.championships
  for delete using (is_championship_admin(id));

drop policy if exists "coaches_insert_admin" on public.coaches;
drop policy if exists "coaches_update_admin" on public.coaches;
drop policy if exists "coaches_delete_admin" on public.coaches;

create policy "coaches_insert_admin" on public.coaches
  for insert with check (is_championship_admin(championship_id));
create policy "coaches_update_admin" on public.coaches
  for update using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));
create policy "coaches_delete_admin" on public.coaches
  for delete using (is_championship_admin(championship_id));

drop policy if exists "teams_insert_admin" on public.teams;
drop policy if exists "teams_update_admin_or_owner" on public.teams;
drop policy if exists "teams_delete_admin" on public.teams;

create policy "teams_insert_admin" on public.teams
  for insert with check (is_championship_admin(championship_id));
create policy "teams_update_admin_or_owner" on public.teams
  for update using (
    is_championship_admin(championship_id) or teams.owner_user_id = (select auth.uid())
  )
  with check (
    is_championship_admin(championship_id) or teams.owner_user_id = (select auth.uid())
  );
create policy "teams_delete_admin" on public.teams
  for delete using (is_championship_admin(championship_id));

drop policy if exists "players_insert_admin_or_owner" on public.players;
drop policy if exists "players_update_admin_or_owner" on public.players;
drop policy if exists "players_delete_admin_or_owner" on public.players;

create policy "players_insert_admin_or_owner" on public.players
  for insert with check (
    is_championship_admin(championship_id)
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = (select auth.uid())
          and t.championship_id = players.championship_id
      )
    )
  );
create policy "players_update_admin_or_owner" on public.players
  for update using (
    is_championship_admin(championship_id)
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id and t.owner_user_id = (select auth.uid())
      )
    )
  ) with check (
    is_championship_admin(championship_id)
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = (select auth.uid())
          and t.championship_id = players.championship_id
      )
    )
  );
create policy "players_delete_admin_or_owner" on public.players
  for delete using (
    is_championship_admin(championship_id)
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id and t.owner_user_id = (select auth.uid())
      )
    )
  );

drop policy if exists "games_insert_admin" on public.games;
drop policy if exists "games_update_admin" on public.games;
drop policy if exists "games_delete_admin" on public.games;

create policy "games_insert_admin" on public.games
  for insert with check (is_championship_admin(championship_id));
create policy "games_update_admin" on public.games
  for update using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));
create policy "games_delete_admin" on public.games
  for delete using (is_championship_admin(championship_id));

drop policy if exists "team_invites_select_admin_or_invitee" on public.team_invites;
drop policy if exists "team_invites_insert_admin" on public.team_invites;
drop policy if exists "team_invites_delete_admin" on public.team_invites;

create policy "team_invites_select_admin_or_invitee" on public.team_invites
  for select using (
    email = (select auth.email())
    or is_championship_admin(championship_id)
  );
create policy "team_invites_insert_admin" on public.team_invites
  for insert with check (
    is_championship_admin(championship_id)
    and exists (
      select 1 from public.teams t
      where t.id = team_invites.team_id and t.championship_id = team_invites.championship_id
    )
  );
create policy "team_invites_delete_admin" on public.team_invites
  for delete using (is_championship_admin(championship_id));

-- ============================================================
-- user_roles: também otimizar auth.uid()
-- ============================================================
drop policy if exists "user_roles_select_own_or_admin" on public.user_roles;
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select using (user_id = (select auth.uid()) or is_admin());

-- gatilho de proteção também usa is_admin(), já otimizado acima (mesma função)
