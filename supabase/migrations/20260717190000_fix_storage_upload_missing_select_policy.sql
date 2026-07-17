-- Bug: every upload to avatars/crests/player-photos was failing with
-- "new row violates row-level security policy for table objects".
--
-- Root cause: the Storage API's upload endpoint does `insert ... returning`,
-- and Postgres RLS also enforces the SELECT policy against the row being
-- returned. These buckets had zero SELECT policies (avatars_select_public
-- was intentionally dropped in 20260717141000 to fix a "public bucket
-- allows listing" advisory; crests/player-photos never had one, since reads
-- happen through the public URL endpoint, not an authenticated SELECT).
-- With no permissive SELECT policy at all, that implicit RETURNING check
-- always failed, so every insert was rejected — even when the actual
-- upload permission (ownership/is_admin) was satisfied.
--
-- Fix: add SELECT policies scoped the same way as each bucket's own
-- insert/update policy (own folder for avatars, is_admin() for
-- crests/player-photos), so the uploader can see the row they just
-- inserted without reopening public listing of the whole bucket.
create policy "avatars_select_own" on storage.objects
  for select using (
    bucket_id = 'avatars'
    and (select auth.uid())::text = (storage.foldername(name))[1]
  );

create policy "crests_select_admin" on storage.objects
  for select using (
    bucket_id = 'crests'
    and is_admin()
  );

create policy "player_photos_select_admin" on storage.objects
  for select using (
    bucket_id = 'player-photos'
    and is_admin()
  );
