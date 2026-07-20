-- Bug sistêmico: toda policy admin de storage no padrão
-- "is_championship_admin((select x.championship_id from tabela x where
-- x.id = ((storage.foldername(name))[1])::uuid))" — quando "tabela" TEM
-- sua própria coluna "name" (players, sponsors, teams todas têm) — o
-- identificador "name" desqualificado dentro da subquery é capturado pela
-- tabela local (x.name) em vez do arquivo sendo inserido/atualizado no
-- storage (storage.objects.name), por regra de escopo do Postgres (FROM
-- mais interno vence). Isso faz o cast ::uuid tentar converter o NOME da
-- entidade (jogador/patrocinador/time) para uuid, o que falha sempre que
-- o nome não é, por acaso, um uuid válido — travando o upload com
-- "invalid input syntax for type uuid" para qualquer nome normal.
-- Corrigido qualificando explicitamente a referência externa como
-- "objects.name" (confirmado via EXPLAIN: isso faz o Postgres reconhecer
-- a expressão como constante em relação à subquery e usar index scan,
-- em vez de sequential scan avaliando o cast em cada linha).

drop policy if exists "player_photos_insert_admin" on storage.objects;
create policy "player_photos_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_update_admin" on storage.objects;
create policy "player_photos_update_admin" on storage.objects
  for update using (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_delete_admin" on storage.objects;
create policy "player_photos_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "crests_insert_admin" on storage.objects;
create policy "crests_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'crests'
    and is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "crests_update_admin" on storage.objects;
create policy "crests_update_admin" on storage.objects
  for update using (
    bucket_id = 'crests'
    and is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "crests_delete_admin" on storage.objects;
create policy "crests_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'crests'
    and is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "sponsor_logos_insert_admin" on storage.objects;
create policy "sponsor_logos_insert_admin" on storage.objects for insert
  with check (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "sponsor_logos_update_admin" on storage.objects;
create policy "sponsor_logos_update_admin" on storage.objects for update
  using (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "sponsor_logos_delete_admin" on storage.objects;
create policy "sponsor_logos_delete_admin" on storage.objects for delete
  using (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

drop policy if exists "sponsor_logos_select_admin" on storage.objects;
create policy "sponsor_logos_select_admin" on storage.objects for select
  using (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );
