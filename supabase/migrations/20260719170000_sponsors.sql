-- Área de patrocinadores: logos configuráveis exibidos no rodapé da
-- página pública do campeonato. Leitura pública (é conteúdo de
-- vitrine), escrita só para admin do campeonato — mesmo padrão de
-- venues/coaches.
create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  logo_url text,
  link_url text,
  created_at timestamptz not null default now()
);

create index if not exists sponsors_championship_id_idx on public.sponsors (championship_id);

alter table public.sponsors enable row level security;

create policy "sponsors_select_public" on public.sponsors for select
  using (true);

create policy "sponsors_insert_admin" on public.sponsors for insert
  with check (is_championship_admin(championship_id));

create policy "sponsors_update_admin" on public.sponsors for update
  using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

create policy "sponsors_delete_admin" on public.sponsors for delete
  using (is_championship_admin(championship_id));

-- Storage: bucket público para os logos, upload restrito ao admin do
-- campeonato dono daquele patrocinador (mesmo esquema de
-- is_championship_admin escopado usado para crests/player-photos).
insert into storage.buckets (id, name, public)
values ('sponsor-logos', 'sponsor-logos', true)
on conflict (id) do nothing;

-- Sem policy de select ampla: buckets públicos servem o objeto direto
-- pela URL pública sem precisar de RLS. Uma policy `using (true)` só
-- serviria para listar o bucket inteiro, que o advisor de segurança
-- aponta como desnecessário e arriscado (mesmo padrão já usado em
-- crests/player-photos) — mantemos o select restrito ao admin, só
-- para satisfazer o "ler de volta após escrever" do próprio upload.
create policy "sponsor_logos_select_admin" on storage.objects for select
  using (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(name))[1])::uuid
    ))
  );

create policy "sponsor_logos_insert_admin" on storage.objects for insert
  with check (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(name))[1])::uuid
    ))
  );

create policy "sponsor_logos_update_admin" on storage.objects for update
  using (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(name))[1])::uuid
    ))
  );

create policy "sponsor_logos_delete_admin" on storage.objects for delete
  using (
    bucket_id = 'sponsor-logos'
    and is_championship_admin((
      select s.championship_id from public.sponsors s where s.id = ((storage.foldername(name))[1])::uuid
    ))
  );
