-- Upload de foto do jogador pelo link público do elenco (/elenco/[token],
-- role anon) estava falhando com "permission denied for function
-- can_manage_sponsors". Causa: o Postgres funde todas as policies
-- permissivas de um mesmo comando (ex.: insert em storage.objects) numa
-- única expressão com OR, então o insert de player-photos também carrega
-- as policies de outros buckets (ex.: sponsor-logos, que usa
-- can_manage_sponsors). A checagem de EXECUTE dessas funções acontece na
-- inicialização do plano, não só quando o branch realmente é alcançado —
-- então falta de grant para anon quebra o insert mesmo o bucket sendo
-- outro. is_admin() já tinha esse grant para anon por este mesmo motivo;
-- has_permission()/can_manage_*() ficaram de fora quando foram criadas.
-- Como essas funções só leem auth.uid() (null para anon), conceder
-- execute para anon é seguro: sempre retornam false para quem não está
-- logado.
grant execute on function public.has_permission(text) to anon;
grant execute on function public.can_manage_championships(uuid) to anon;
grant execute on function public.can_manage_teams_games(uuid) to anon;
grant execute on function public.can_manage_finance(uuid) to anon;
grant execute on function public.can_manage_sponsors(uuid) to anon;
