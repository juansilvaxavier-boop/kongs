-- O linter de segurança do Supabase aponta audit_log_row() como uma
-- SECURITY DEFINER function exposta via PostgREST RPC para anon/
-- authenticated. Na prática ela não pode ser chamada diretamente
-- (Postgres recusa: "trigger functions can only be called as
-- triggers"), mas revogar o EXECUTE remove a superfície de ataque
-- e resolve o aviso — o disparo do trigger não depende desses grants.
revoke execute on function public.audit_log_row() from public, anon, authenticated;
