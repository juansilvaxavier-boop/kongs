-- ============================================================
-- Colunas novas
-- ============================================================
alter table public.teams add column if not exists owner_user_id uuid references auth.users(id) on delete set null;
alter table public.teams add column if not exists crest_url text;

-- ============================================================
-- Papéis (admin, team_owner)
-- ============================================================
create table if not exists public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'team_owner')),
  created_at timestamptz not null default now()
);

alter table public.user_roles enable row level security;

-- ============================================================
-- Convites de dono de time (sem precisar de service role key)
-- ============================================================
create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  team_id uuid not null references public.teams(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

alter table public.team_invites enable row level security;

create index if not exists idx_team_invites_team on public.team_invites(team_id);
create index if not exists idx_team_invites_championship on public.team_invites(championship_id);
create index if not exists idx_team_invites_email_pending on public.team_invites(email) where accepted_at is null;

-- ============================================================
-- Funções auxiliares
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Gatilho: apenas admins podem alterar championship_id/owner_user_id de um time
create or replace function public.teams_protect_ownership_fields()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_admin() then
    if new.championship_id is distinct from old.championship_id then
      raise exception 'Não é permitido alterar o campeonato do time.';
    end if;
    if new.owner_user_id is distinct from old.owner_user_id then
      raise exception 'Não é permitido alterar o responsável pelo time por aqui.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists teams_protect_ownership_fields_trigger on public.teams;
create trigger teams_protect_ownership_fields_trigger
  before update on public.teams
  for each row execute function public.teams_protect_ownership_fields();

-- Aceitar convite: SECURITY DEFINER, mas auto-verifica o e-mail do chamador
create or replace function public.accept_team_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite record;
begin
  select * into v_invite from public.team_invites where id = p_invite_id and accepted_at is null;

  if v_invite is null then
    raise exception 'Convite não encontrado ou já utilizado.';
  end if;

  if v_invite.email is distinct from auth.email() then
    raise exception 'Este convite não pertence ao usuário autenticado.';
  end if;

  update public.teams set owner_user_id = auth.uid() where id = v_invite.team_id;

  insert into public.user_roles (user_id, role)
  values (auth.uid(), 'team_owner')
  on conflict (user_id) do update set role = 'team_owner'
  where public.user_roles.role <> 'admin';

  update public.team_invites set accepted_at = now() where id = p_invite_id;
end;
$$;

grant execute on function public.accept_team_invite(uuid) to authenticated;

-- ============================================================
-- Limpar políticas antigas (modelo single-tenant anterior)
-- ============================================================
drop policy if exists "championships_select_own" on public.championships;
drop policy if exists "championships_insert_own" on public.championships;
drop policy if exists "championships_update_own" on public.championships;
drop policy if exists "championships_delete_own" on public.championships;

drop policy if exists "coaches_select_own" on public.coaches;
drop policy if exists "coaches_insert_own" on public.coaches;
drop policy if exists "coaches_update_own" on public.coaches;
drop policy if exists "coaches_delete_own" on public.coaches;

drop policy if exists "teams_select_own" on public.teams;
drop policy if exists "teams_insert_own" on public.teams;
drop policy if exists "teams_update_own" on public.teams;
drop policy if exists "teams_delete_own" on public.teams;

drop policy if exists "players_select_own" on public.players;
drop policy if exists "players_insert_own" on public.players;
drop policy if exists "players_update_own" on public.players;
drop policy if exists "players_delete_own" on public.players;

drop policy if exists "games_select_own" on public.games;
drop policy if exists "games_insert_own" on public.games;
drop policy if exists "games_update_own" on public.games;
drop policy if exists "games_delete_own" on public.games;

-- ============================================================
-- championships: leitura pública, escrita só do admin dono
-- ============================================================
create policy "championships_select_public" on public.championships
  for select using (true);
create policy "championships_insert_admin" on public.championships
  for insert with check (is_admin() and owner_id = auth.uid());
create policy "championships_update_admin" on public.championships
  for update using (is_admin() and owner_id = auth.uid())
  with check (is_admin() and owner_id = auth.uid());
create policy "championships_delete_admin" on public.championships
  for delete using (is_admin() and owner_id = auth.uid());

-- ============================================================
-- coaches: leitura pública, escrita só do admin dono do campeonato
-- ============================================================
create policy "coaches_select_public" on public.coaches
  for select using (true);
create policy "coaches_insert_admin" on public.coaches
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid() and is_admin()
  ));
create policy "coaches_update_admin" on public.coaches
  for update using (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid() and is_admin()
  )) with check (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid() and is_admin()
  ));
create policy "coaches_delete_admin" on public.coaches
  for delete using (exists (
    select 1 from public.championships c
    where c.id = coaches.championship_id and c.owner_id = auth.uid() and is_admin()
  ));

-- ============================================================
-- teams: leitura pública; admin dono do campeonato tem controle total;
-- dono do time só atualiza o próprio time (campos protegidos por trigger)
-- ============================================================
create policy "teams_select_public" on public.teams
  for select using (true);
create policy "teams_insert_admin" on public.teams
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid() and is_admin()
  ));
create policy "teams_update_admin_or_owner" on public.teams
  for update using (
    exists (
      select 1 from public.championships c
      where c.id = teams.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    or teams.owner_user_id = auth.uid()
  )
  with check (
    exists (
      select 1 from public.championships c
      where c.id = teams.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    or teams.owner_user_id = auth.uid()
  );
create policy "teams_delete_admin" on public.teams
  for delete using (exists (
    select 1 from public.championships c
    where c.id = teams.championship_id and c.owner_id = auth.uid() and is_admin()
  ));

-- ============================================================
-- players: leitura pública; admin controla tudo; dono do time
-- só mexe nos jogadores do seu próprio time
-- ============================================================
create policy "players_select_public" on public.players
  for select using (true);
create policy "players_insert_admin_or_owner" on public.players
  for insert with check (
    exists (
      select 1 from public.championships c
      where c.id = players.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = auth.uid()
          and t.championship_id = players.championship_id
      )
    )
  );
create policy "players_update_admin_or_owner" on public.players
  for update using (
    exists (
      select 1 from public.championships c
      where c.id = players.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id and t.owner_user_id = auth.uid()
      )
    )
  ) with check (
    exists (
      select 1 from public.championships c
      where c.id = players.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id
          and t.owner_user_id = auth.uid()
          and t.championship_id = players.championship_id
      )
    )
  );
create policy "players_delete_admin_or_owner" on public.players
  for delete using (
    exists (
      select 1 from public.championships c
      where c.id = players.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    or (
      players.team_id is not null
      and exists (
        select 1 from public.teams t
        where t.id = players.team_id and t.owner_user_id = auth.uid()
      )
    )
  );

-- ============================================================
-- games: leitura pública; escrita só do admin dono do campeonato
-- ============================================================
create policy "games_select_public" on public.games
  for select using (true);
create policy "games_insert_admin" on public.games
  for insert with check (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid() and is_admin()
  ));
create policy "games_update_admin" on public.games
  for update using (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid() and is_admin()
  )) with check (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid() and is_admin()
  ));
create policy "games_delete_admin" on public.games
  for delete using (exists (
    select 1 from public.championships c
    where c.id = games.championship_id and c.owner_id = auth.uid() and is_admin()
  ));

-- ============================================================
-- user_roles: cada um só lê o próprio papel; admin lê todos
-- (escrita só via accept_team_invite ou SQL direto do admin)
-- ============================================================
create policy "user_roles_select_own_or_admin" on public.user_roles
  for select using (user_id = auth.uid() or is_admin());

-- ============================================================
-- team_invites: admin dono do campeonato gerencia;
-- convidado só vê o próprio convite pendente (por e-mail)
-- ============================================================
create policy "team_invites_select_admin_or_invitee" on public.team_invites
  for select using (
    email = auth.email()
    or exists (
      select 1 from public.championships c
      where c.id = team_invites.championship_id and c.owner_id = auth.uid() and is_admin()
    )
  );
create policy "team_invites_insert_admin" on public.team_invites
  for insert with check (
    exists (
      select 1 from public.championships c
      where c.id = team_invites.championship_id and c.owner_id = auth.uid() and is_admin()
    )
    and exists (
      select 1 from public.teams t
      where t.id = team_invites.team_id and t.championship_id = team_invites.championship_id
    )
  );
create policy "team_invites_delete_admin" on public.team_invites
  for delete using (
    exists (
      select 1 from public.championships c
      where c.id = team_invites.championship_id and c.owner_id = auth.uid() and is_admin()
    )
  );
