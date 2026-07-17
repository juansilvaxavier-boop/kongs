-- Per-team public roster registration link: the team's responsible person
-- fills in players (max 20) and 1 coach without logging in, through an
-- opaque token URL. Same capability-URL pattern as championship_sumula_tokens
-- (table has RLS enabled but zero policies — only reachable through the
-- SECURITY DEFINER functions below, never via direct table SELECT).

create table if not exists public.team_roster_tokens (
  team_id uuid primary key references public.teams(id) on delete cascade,
  championship_id uuid not null references public.championships(id) on delete cascade,
  token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.team_roster_tokens enable row level security;

create index if not exists team_roster_tokens_championship_id_idx
  on public.team_roster_tokens (championship_id);

-- Admin-only: get or create this team's roster link.
create or replace function public.get_or_create_team_roster_token(p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_token uuid;
begin
  select championship_id into v_championship_id from public.teams where id = p_team_id;
  if v_championship_id is null then
    raise exception 'Time não encontrado.';
  end if;
  if not public.is_championship_admin(v_championship_id) then
    raise exception 'Sem permissão para gerar o link do elenco.';
  end if;

  insert into public.team_roster_tokens (team_id, championship_id)
  values (p_team_id, v_championship_id)
  on conflict (team_id) do nothing;

  select token into v_token from public.team_roster_tokens where team_id = p_team_id;
  return v_token;
end;
$$;

revoke all on function public.get_or_create_team_roster_token(uuid) from public;
grant execute on function public.get_or_create_team_roster_token(uuid) to authenticated;

-- Admin-only: invalidate the current link and issue a new one.
create or replace function public.regenerate_team_roster_token(p_team_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_token uuid := gen_random_uuid();
begin
  select championship_id into v_championship_id from public.teams where id = p_team_id;
  if v_championship_id is null then
    raise exception 'Time não encontrado.';
  end if;
  if not public.is_championship_admin(v_championship_id) then
    raise exception 'Sem permissão para gerar o link do elenco.';
  end if;

  insert into public.team_roster_tokens (team_id, championship_id, token)
  values (p_team_id, v_championship_id, v_token)
  on conflict (team_id) do update set token = v_token;

  return v_token;
end;
$$;

revoke all on function public.regenerate_team_roster_token(uuid) from public;
grant execute on function public.regenerate_team_roster_token(uuid) to authenticated;

-- Public (anon + authenticated): team header info for the registration page.
create or replace function public.roster_get_team(p_token uuid)
returns table (
  team_id uuid,
  team_name text,
  crest_url text,
  championship_name text,
  coach_id uuid,
  coach_name text,
  player_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    t.id,
    t.name,
    t.crest_url,
    c.name,
    t.coach_id,
    co.name,
    (select count(*) from public.players p where p.team_id = t.id)
  from public.team_roster_tokens trt
  join public.teams t on t.id = trt.team_id
  join public.championships c on c.id = trt.championship_id
  left join public.coaches co on co.id = t.coach_id
  where trt.token = p_token;
$$;

revoke all on function public.roster_get_team(uuid) from public;
grant execute on function public.roster_get_team(uuid) to anon, authenticated;

-- Public: list of players currently registered for this team.
create or replace function public.roster_list_players(p_token uuid)
returns table (
  id uuid,
  name text,
  number integer,
  "position" text,
  document_type text,
  document_number text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.number, p.position, p.document_type, p.document_number
  from public.players p
  join public.team_roster_tokens trt on trt.team_id = p.team_id
  where trt.token = p_token
  order by p.created_at;
$$;

revoke all on function public.roster_list_players(uuid) from public;
grant execute on function public.roster_list_players(uuid) to anon, authenticated;

-- Shared validation helper for add/update — raises on the first invalid field.
create or replace function public.roster_validate_player(
  p_name text,
  p_document_type text,
  p_document_number text,
  p_position text
)
returns table (v_document_type text, v_document_number text)
language plpgsql
immutable
set search_path = public
as $$
declare
  v_digits text;
begin
  if coalesce(trim(p_name), '') = '' then
    raise exception 'Informe o nome completo do jogador.';
  end if;
  if p_position is null or p_position not in ('Goleiro', 'Zagueiro', 'Meia', 'Atacante') then
    raise exception 'Selecione a posição do jogador.';
  end if;
  if p_document_type not in ('cpf', 'rg') then
    raise exception 'Selecione o tipo de documento (CPF ou RG).';
  end if;
  if coalesce(trim(p_document_number), '') = '' then
    raise exception 'Informe o número do documento.';
  end if;

  if p_document_type = 'cpf' then
    v_digits := regexp_replace(p_document_number, '\D', '', 'g');
    if length(v_digits) <> 11 then
      raise exception 'CPF precisa ter 11 dígitos.';
    end if;
    return query select 'cpf'::text, v_digits;
  end if;

  return query select 'rg'::text, trim(p_document_number);
end;
$$;

revoke all on function public.roster_validate_player(text, text, text, text) from public;

-- Public: add a player, hard-capped at 20 per team.
create or replace function public.roster_add_player(
  p_token uuid,
  p_name text,
  p_document_type text,
  p_document_number text,
  p_position text,
  p_number integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_championship_id uuid;
  v_count integer;
  v_doc record;
  v_player_id uuid;
begin
  select team_id, championship_id into v_team_id, v_championship_id
  from public.team_roster_tokens
  where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;

  select count(*) into v_count from public.players where team_id = v_team_id;
  if v_count >= 20 then
    raise exception 'Elenco completo — máximo de 20 jogadores por time.';
  end if;

  select * into v_doc from public.roster_validate_player(p_name, p_document_type, p_document_number, p_position);

  insert into public.players (championship_id, team_id, name, number, position, document_type, document_number)
  values (v_championship_id, v_team_id, trim(p_name), p_number, p_position, v_doc.v_document_type, v_doc.v_document_number)
  returning id into v_player_id;

  return v_player_id;
end;
$$;

revoke all on function public.roster_add_player(uuid, text, text, text, text, integer) from public;
grant execute on function public.roster_add_player(uuid, text, text, text, text, integer) to anon, authenticated;

-- Public: edit a player already registered through this team's link.
create or replace function public.roster_update_player(
  p_token uuid,
  p_player_id uuid,
  p_name text,
  p_document_type text,
  p_document_number text,
  p_position text,
  p_number integer
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_player_team uuid;
  v_doc record;
begin
  select team_id into v_team_id from public.team_roster_tokens where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team <> v_team_id then
    raise exception 'Jogador não encontrado neste time.';
  end if;

  select * into v_doc from public.roster_validate_player(p_name, p_document_type, p_document_number, p_position);

  update public.players
  set name = trim(p_name),
      number = p_number,
      position = p_position,
      document_type = v_doc.v_document_type,
      document_number = v_doc.v_document_number
  where id = p_player_id;
end;
$$;

revoke all on function public.roster_update_player(uuid, uuid, text, text, text, text, integer) from public;
grant execute on function public.roster_update_player(uuid, uuid, text, text, text, text, integer) to anon, authenticated;

-- Public: remove a player registered through this team's link.
create or replace function public.roster_delete_player(p_token uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_player_team uuid;
begin
  select team_id into v_team_id from public.team_roster_tokens where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team <> v_team_id then
    raise exception 'Jogador não encontrado neste time.';
  end if;

  delete from public.players where id = p_player_id;
end;
$$;

revoke all on function public.roster_delete_player(uuid, uuid) from public;
grant execute on function public.roster_delete_player(uuid, uuid) to anon, authenticated;

-- Public: set/rename/clear this team's single coach (schema already caps it
-- at 1 per team via teams.coach_id being a single FK column).
create or replace function public.roster_set_coach(p_token uuid, p_coach_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_championship_id uuid;
  v_name text := trim(coalesce(p_coach_name, ''));
  v_coach_id uuid;
begin
  select team_id, championship_id into v_team_id, v_championship_id
  from public.team_roster_tokens
  where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;

  if v_name = '' then
    update public.teams set coach_id = null where id = v_team_id;
    return;
  end if;

  select coach_id into v_coach_id from public.teams where id = v_team_id;

  if v_coach_id is null then
    insert into public.coaches (championship_id, name)
    values (v_championship_id, v_name)
    returning id into v_coach_id;
    update public.teams set coach_id = v_coach_id where id = v_team_id;
  else
    update public.coaches set name = v_name where id = v_coach_id;
  end if;
end;
$$;

revoke all on function public.roster_set_coach(uuid, text) from public;
grant execute on function public.roster_set_coach(uuid, text) to anon, authenticated;
