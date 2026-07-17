alter table public.players
  add column if not exists photo_url text;

insert into storage.buckets (id, name, public)
values ('player-photos', 'player-photos', true)
on conflict (id) do nothing;

create policy "player_photos_insert_admin" on storage.objects
  for insert with check (bucket_id = 'player-photos' and is_admin());
create policy "player_photos_update_admin" on storage.objects
  for update using (bucket_id = 'player-photos' and is_admin());
create policy "player_photos_delete_admin" on storage.objects
  for delete using (bucket_id = 'player-photos' and is_admin());
