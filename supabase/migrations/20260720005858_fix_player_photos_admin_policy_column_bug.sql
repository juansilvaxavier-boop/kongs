-- As políticas player_photos_insert_admin/update_admin/delete_admin estavam
-- usando storage.foldername(p.name) — ou seja, o NOME do jogador (coluna
-- "name" da tabela players), em vez do CAMINHO do arquivo no storage
-- (storage.objects.name). Isso faz o cast ::uuid falhar sempre que algum
-- jogador tem um nome que não é um UUID válido (praticamente todos),
-- travando qualquer upload de foto pelo admin com "invalid input syntax
-- for type uuid". O caminho correto é derivado do próprio objeto sendo
-- inserido/atualizado no storage (name, sem qualificador), não da tabela
-- players.
--
-- NOTA: esta migração por si só não resolveu o problema — "name" sem
-- qualificador dentro da subquery continua sendo capturado pela tabela
-- local (ver migração seguinte, fix_admin_storage_policy_name_shadowing,
-- que qualifica explicitamente como objects.name).
drop policy if exists "player_photos_insert_admin" on storage.objects;
create policy "player_photos_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_update_admin" on storage.objects;
create policy "player_photos_update_admin" on storage.objects
  for update using (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(name))[1])::uuid
    ))
  );

drop policy if exists "player_photos_delete_admin" on storage.objects;
create policy "player_photos_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'player-photos'
    and is_championship_admin((
      select p.championship_id from public.players p where p.id = ((storage.foldername(name))[1])::uuid
    ))
  );
