-- No ranking do bolão, quem não preencheu nome no perfil precisa
-- aparecer com o e-mail em vez do genérico "Torcedor". auth.users não é
-- exposto via API pra usuários comuns, então esta função devolve só os
-- e-mails de quem de fato deu algum palpite naquele campeonato
-- específico (o mesmo grupo de gente cujo nome/foto o ranking já
-- mostra pra todo mundo que participa do bolão) — não é uma forma de
-- consultar e-mail de qualquer usuário do sistema.
create or replace function public.bolao_participant_emails(p_championship_id uuid, p_user_ids uuid[])
returns table (user_id uuid, email text)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select u.id, u.email
  from auth.users u
  where u.id = any(p_user_ids)
    and exists (
      select 1 from public.bolao_predictions bp
      where bp.user_id = u.id and bp.championship_id = p_championship_id
      union all
      select 1 from public.bolao_group_predictions gp
      where gp.user_id = u.id and gp.championship_id = p_championship_id
      union all
      select 1 from public.bolao_topscorer_predictions tp
      where tp.user_id = u.id and tp.championship_id = p_championship_id
      union all
      select 1 from public.bolao_champion_predictions cp
      where cp.user_id = u.id and cp.championship_id = p_championship_id
    );
end;
$$;

revoke all on function public.bolao_participant_emails(uuid, uuid[]) from public;
grant execute on function public.bolao_participant_emails(uuid, uuid[]) to authenticated;
