insert into storage.buckets (id, name, public)
values ('crests', 'crests', true)
on conflict (id) do nothing;

create policy "crests_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'crests'
    and is_admin()
  );

create policy "crests_update_admin" on storage.objects
  for update using (
    bucket_id = 'crests'
    and is_admin()
  );

create policy "crests_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'crests'
    and is_admin()
  );
