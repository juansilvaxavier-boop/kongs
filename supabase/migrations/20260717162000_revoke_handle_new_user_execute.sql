-- handle_new_user only makes sense as an AFTER INSERT trigger on auth.users
-- (it relies on the NEW record) and was never meant to be called directly
-- via the PostgREST RPC endpoint.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
