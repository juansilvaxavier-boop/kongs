-- O Supabase concede EXECUTE padrão a anon/authenticated em funções
-- novas de forma assíncrona, depois do revoke feito na própria
-- migration de criação — mesmo comportamento já visto em
-- admin_list_users. Revoga aqui, numa migration separada, para
-- garantir que o revoke seja o último a valer.
revoke execute on function public.admin_list_audit_log(int, int, text, text, uuid) from anon;
