-- Lets the person filling in a team's roster link upload each player's
-- photo, without granting anon broad write access to the player-photos
-- bucket: the storage policy below re-checks, per file, that the target
-- player belongs to a team whose roster link exists and has not been
-- submitted yet (same trust boundary as every other roster_* mutation).

create or replace function public.roster_can_upload_player_photo(p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.players p
    join public.team_roster_tokens trt on trt.team_id = p.team_id
    where p.id = p_player_id
      and trt.submitted_at is null
  );
$$;

create policy "player_photos_insert_roster_link"
on storage.objects for insert
to anon, authenticated
with check (
  bucket_id = 'player-photos'
  and public.roster_can_upload_player_photo(((storage.foldername(name))[1])::uuid)
);

create policy "player_photos_update_roster_link"
on storage.objects for update
to anon, authenticated
using (
  bucket_id = 'player-photos'
  and public.roster_can_upload_player_photo(((storage.foldername(name))[1])::uuid)
);

-- Public: persist the uploaded photo's URL once the file itself has been
-- uploaded to storage (the token/lock checks mirror every other roster_*
-- write function).
create or replace function public.roster_set_player_photo(
  p_token uuid,
  p_player_id uuid,
  p_photo_url text
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

  update public.players set photo_url = p_photo_url where id = p_player_id;
end;
$$;

revoke all on function public.roster_set_player_photo(uuid, uuid, text) from public;
grant execute on function public.roster_set_player_photo(uuid, uuid, text) to anon, authenticated;

-- roster_list_players now also returns photo_url. CREATE OR REPLACE cannot
-- change a function's OUT columns, so the old signature must be dropped.
drop function if exists public.roster_list_players(uuid);

create or replace function public.roster_list_players(p_token uuid)
returns table (
  id uuid,
  name text,
  number integer,
  "position" text,
  document_type text,
  document_number text,
  birth_date date,
  photo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.name, p.number, p.position, p.document_type, p.document_number, p.birth_date, p.photo_url
  from public.players p
  join public.team_roster_tokens trt on trt.team_id = p.team_id
  where trt.token = p_token
  order by p.created_at;
$$;

revoke all on function public.roster_list_players(uuid) from public;
grant execute on function public.roster_list_players(uuid) to anon, authenticated;
