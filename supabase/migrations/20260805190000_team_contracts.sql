alter table public.teams
  add column if not exists contract_storage_path text,
  add column if not exists contract_uploaded_at timestamptz;

-- Bucket privado: o contrato carrega nome/CPF de jogadores e termos
-- financeiros, então diferente de crests/player-photos (buckets públicos,
-- ok pra exibição pública), aqui o acesso de leitura também é restrito por
-- RLS e a URL é sempre assinada (curta duração) em vez de pública.
insert into storage.buckets (id, name, public)
values ('team-contracts', 'team-contracts', false)
on conflict (id) do nothing;

create policy "team_contracts_insert_admin" on storage.objects
  for insert with check (
    bucket_id = 'team-contracts'
    and public.is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

create policy "team_contracts_update_admin" on storage.objects
  for update using (
    bucket_id = 'team-contracts'
    and public.is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

create policy "team_contracts_delete_admin" on storage.objects
  for delete using (
    bucket_id = 'team-contracts'
    and public.is_championship_admin((
      select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
    ))
  );

-- Leitura (necessária inclusive pro upload funcionar, já que o endpoint de
-- upload do Storage faz um `insert ... returning` que também passa pela
-- policy de select): admin do campeonato ou o dono do time vinculado.
create policy "team_contracts_select_admin_or_owner" on storage.objects
  for select using (
    bucket_id = 'team-contracts'
    and (
      public.is_championship_admin((
        select t.championship_id from public.teams t where t.id = ((storage.foldername(objects.name))[1])::uuid
      ))
      or exists (
        select 1 from public.teams t
        where t.id = ((storage.foldername(objects.name))[1])::uuid
        and t.owner_user_id = (select auth.uid())
      )
    )
  );
