-- Public buckets already serve objects via the public URL endpoint without
-- going through RLS, so this SELECT policy only added the ability to list
-- every file in the bucket (flagged by the security advisor) with no
-- benefit for how avatars are actually served.
drop policy if exists "avatars_select_public" on storage.objects;
