-- Impede cadastrar o mesmo jogador duas vezes no mesmo campeonato quando o
-- documento é CPF. RG não tem essa restrição (não é um identificador único
-- confiável do mesmo jeito). O índice é a garantia de última instância;
-- roster_add_player/roster_update_player abaixo já barram o caso comum com
-- uma mensagem amigável antes de chegar no banco.
create unique index if not exists players_championship_cpf_unique
  on public.players (championship_id, document_number)
  where document_type = 'cpf';

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

  if v_doc.v_document_type = 'cpf' and exists (
    select 1 from public.players
    where championship_id = v_championship_id
      and document_type = 'cpf'
      and document_number = v_doc.v_document_number
  ) then
    raise exception 'Já existe um jogador cadastrado com este CPF neste campeonato.';
  end if;

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
  v_championship_id uuid;
  v_submitted_at timestamptz;
  v_player_team uuid;
  v_doc record;
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

  select team_id into v_player_team from public.players where id = p_player_id;
  if v_player_team is null or v_player_team <> v_team_id then
    raise exception 'Jogador não encontrado neste time.';
  end if;

  select * into v_doc from public.roster_validate_player(p_name, p_document_type, p_document_number, p_position, p_birth_date);

  if v_doc.v_document_type = 'cpf' and exists (
    select 1 from public.players
    where championship_id = v_championship_id
      and document_type = 'cpf'
      and document_number = v_doc.v_document_number
      and id <> p_player_id
  ) then
    raise exception 'Já existe um jogador cadastrado com este CPF neste campeonato.';
  end if;

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
