create index if not exists idx_championships_owner on public.championships(owner_id);
create index if not exists idx_teams_owner_user on public.teams(owner_user_id);
create index if not exists idx_championship_admins_user on public.championship_admins(user_id);
