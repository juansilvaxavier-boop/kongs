-- admin_list_users() só deve ser chamável por usuários autenticados
-- (a própria função já barra não-admins); anon herdava EXECUTE via
-- privilégio padrão do schema, então revogamos explicitamente aqui.
revoke execute on function public.admin_list_users() from anon;
