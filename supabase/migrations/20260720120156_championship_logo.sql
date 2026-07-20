alter table public.championships add column if not exists logo_url text;

insert into storage.buckets (id, name, public)
values ('championship-logos', 'championship-logos', true)
on conflict (id) do nothing;

-- O caminho de upload é "<championship_id>/logo.<ext>" — o primeiro
-- segmento do path JÁ é o championship_id, então não precisamos de uma
-- subquery ligando a outra tabela com coluna "name" (evita o mesmo bug de
-- sombreamento corrigido em player-photos/crests/sponsor-logos).
create policy "championship_logos_select_admin" on storage.objects for select
  using (
    bucket_id = 'championship-logos'
    and is_championship_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "championship_logos_insert_admin" on storage.objects for insert
  with check (
    bucket_id = 'championship-logos'
    and is_championship_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "championship_logos_update_admin" on storage.objects for update
  using (
    bucket_id = 'championship-logos'
    and is_championship_admin(((storage.foldername(name))[1])::uuid)
  );

create policy "championship_logos_delete_admin" on storage.objects for delete
  using (
    bucket_id = 'championship-logos'
    and is_championship_admin(((storage.foldername(name))[1])::uuid)
  );
