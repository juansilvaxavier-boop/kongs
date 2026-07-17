-- Fixes photo uploads failing on the roster link (/elenco/[token]) with
-- "new row violates row-level security policy for table objects".
--
-- Root cause: the INSERT/UPDATE policies added for the roster-link photo
-- upload had no matching SELECT policy. Supabase Storage's upload endpoint
-- reads the object row back after writing it (equivalent to `INSERT ...
-- RETURNING`), and Postgres enforces the SELECT policy on that read-back
-- too — even though the INSERT/UPDATE check itself passes, the row can't
-- be returned without a SELECT policy, and Postgres reports that failure
-- with the exact same "row-level security policy" message, making it look
-- like the write was rejected. Verified by reproducing the exact failure
-- and fix in an isolated scratch table before applying here.
create policy "player_photos_select_roster_link"
on storage.objects for select
to anon, authenticated
using (
  bucket_id = 'player-photos'
  and roster_can_upload_player_photo(((storage.foldername(name))[1])::uuid)
);
