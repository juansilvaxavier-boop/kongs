alter table public.championships
  add column if not exists team_count int check (team_count is null or team_count > 0),
  add column if not exists group_count int check (group_count is null or group_count > 0);
