-- Adds birth date to players (required going forward, enforced at the
-- application/RPC layer — nullable at the DB level so existing rows are
-- unaffected) and a submit/lock flow to the team roster link: the
-- responsible person can save progress and come back, but "Enviar" is a
-- one-way switch that blocks any further roster_* writes for that token.

alter table public.players add column if not exists birth_date date;
alter table public.team_roster_tokens add column if not exists submitted_at timestamptz;

-- CREATE OR REPLACE does not change a function's argument list — it adds a
-- new overload and leaves the old one (with its old body) registered. Drop
-- the old signatures explicitly before recreating with the extra
-- p_birth_date parameter.
drop function if exists public.roster_validate_player(text, text, text, text);
drop function if exists public.roster_add_player(uuid, text, text, text, text, integer);
drop function if exists public.roster_update_player(uuid, uuid, text, text, text, text, integer);
-- Same signature, but OUT columns change (added submitted_at / birth_date) —
-- CREATE OR REPLACE cannot change a function's return row type either.
drop function if exists public.roster_get_team(uuid);
drop function if exists public.roster_list_players(uuid);

create or replace function public.roster_validate_player(
  p_name text,
  p_document_type text,
  p_document_number text,
  p_position text,
  p_birth_date date
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
  if p_birth_date is null then
    raise exception 'Informe a data de nascimento do jogador.';
  end if;
  if p_birth_date > current_date then
    raise exception 'Data de nascimento inválida.';
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

revoke all on function public.roster_validate_player(text, text, text, text, date) from public;

create or replace function public.roster_add_player(
  p_token uuid,
  p_name text,
  p_document_type text,
  p_document_number text,
  p_position text,
  p_number integer,
  p_birth_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_championship_id uuid;
  v_submitted_at timestamptz;
  v_count integer;
  v_doc record;
  v_player_id uuid;
begin
  select team_id, championship_id, submitted_at into v_team_id, v_championship_id, v_submitted_at
  from public.team_roster_tokens
  where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;
  if v_submitted_at is not null then
    raise exception 'Cadastro já enviado — não é possível mais editar.';
  end if;

  select count(*) into v_count from public.players where team_id = v_team_id;
  if v_count >= 20 then
    raise exception 'Elenco completo — máximo de 20 jogadores por time.';
  end if;

  select * into v_doc from public.roster_validate_player(p_name, p_document_type, p_document_number, p_position, p_birth_date);

  insert into public.players (championship_id, team_id, name, number, position, document_type, document_number, birth_date)
  values (v_championship_id, v_team_id, trim(p_name), p_number, p_position, v_doc.v_document_type, v_doc.v_document_number, p_birth_date)
  returning id into v_player_id;

  return v_player_id;
end;
$$;

revoke all on function public.roster_add_player(uuid, text, text, text, text, integer, date) from public;
grant execute on function public.roster_add_player(uuid, text, text, text, text, integer, date) to anon, authenticated;

create or replace function public.roster_update_player(
  p_token uuid,
  p_player_id uuid,
  p_name text,
  p_document_type text,
  p_document_number text,
  p_position text,
  p_number integer,
  p_birth_date date
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_submitted_at timestamptz;
  v_player_team uuid;
  v_doc record;
begin
  select team_id, submitted_at into v_team_id, v_submitted_at
  from public.team_roster_tokens
  where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;
  if v_submitted_at is not null then
    raise exception 'Cadastro já enviado — não é possível mais editar.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team <> v_team_id then
    raise exception 'Jogador não encontrado neste time.';
  end if;

  select * into v_doc from public.roster_validate_player(p_name, p_document_type, p_document_number, p_position, p_birth_date);

  update public.players
  set name = trim(p_name),
      number = p_number,
      position = p_position,
      document_type = v_doc.v_document_type,
      document_number = v_doc.v_document_number,
      birth_date = p_birth_date
  where id = p_player_id;
end;
$$;

revoke all on function public.roster_update_player(uuid, uuid, text, text, text, text, integer, date) from public;
grant execute on function public.roster_update_player(uuid, uuid, text, text, text, text, integer, date) to anon, authenticated;

-- Delete/coach actions also become read-only once submitted.
create or replace function public.roster_delete_player(p_token uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_submitted_at timestamptz;
  v_player_team uuid;
begin
  select team_id, submitted_at into v_team_id, v_submitted_at
  from public.team_roster_tokens
  where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;
  if v_submitted_at is not null then
    raise exception 'Cadastro já enviado — não é possível mais editar.';
  end if;

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team <> v_team_id then
    raise exception 'Jogador não encontrado neste time.';
  end if;

  delete from public.players where id = p_player_id;
end;
$$;

create or replace function public.roster_set_coach(p_token uuid, p_coach_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
  v_championship_id uuid;
  v_submitted_at timestamptz;
  v_name text := trim(coalesce(p_coach_name, ''));
  v_coach_id uuid;
begin
  select team_id, championship_id, submitted_at into v_team_id, v_championship_id, v_submitted_at
  from public.team_roster_tokens
  where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;
  if v_submitted_at is not null then
    raise exception 'Cadastro já enviado — não é possível mais editar.';
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

-- Public: the one-way "Enviar" switch — from this point on, roster_* write
-- functions reject any further changes for this token.
create or replace function public.roster_submit(p_token uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team_id uuid;
begin
  select team_id into v_team_id from public.team_roster_tokens where token = p_token;
  if v_team_id is null then
    raise exception 'Link inválido.';
  end if;

  update public.team_roster_tokens
  set submitted_at = coalesce(submitted_at, now())
  where token = p_token;
end;
$$;

revoke all on function public.roster_submit(uuid) from public;
grant execute on function public.roster_submit(uuid) to anon, authenticated;

-- Team header now also reports the submitted state and birth dates.
create or replace function public.roster_get_team(p_token uuid)
returns table (
  team_id uuid,
  team_name text,
  crest_url text,
  championship_name text,
  coach_id uuid,
  coach_name text,
  player_count bigint,
  submitted_at timestamptz
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
    (select count(*) from public.players p where p.team_id = t.id),
    trt.submitted_at
  from public.team_roster_tokens trt
  join public.teams t on t.id = trt.team_id
  join public.championships c on c.id = trt.championship_id
  left join public.coaches co on co.id = t.coach_id
  where trt.token = p_token;
$$;

revoke all on function public.roster_get_team(uuid) from public;
grant execute on function public.roster_get_team(uuid) to anon, authenticated;

create or replace function public.roster_list_players(p_token uuid)
returns table (
  id uuid,
  name text,
  number integer,
  "position" text,
  document_type text,
  document_number text,
  birth_date date
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.number, p.position, p.document_type, p.document_number, p.birth_date
  from public.players p
  join public.team_roster_tokens trt on trt.team_id = p.team_id
  where trt.token = p_token
  order by p.created_at;
$$;

revoke all on function public.roster_list_players(uuid) from public;
grant execute on function public.roster_list_players(uuid) to anon, authenticated;

-- Regenerating a link now also resets the submitted lock, since a new link
-- represents a fresh editing session.
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
  on conflict (team_id) do update set token = v_token, submitted_at = null;

  return v_token;
end;
$$;
