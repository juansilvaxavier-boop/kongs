revoke all on function public.accept_team_invite(uuid) from public;
revoke all on function public.accept_team_invite(uuid) from anon;
grant execute on function public.accept_team_invite(uuid) to authenticated;
