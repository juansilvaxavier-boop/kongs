create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, phone)
  values (new.id, nullif(trim(new.raw_user_meta_data->>'phone'), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
