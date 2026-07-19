-- Assinaturas de notificação push (Web Push), por campeonato. Qualquer
-- visitante pode assinar sem login (insert público) — mas ninguém além
-- do admin daquele campeonato pode LER as assinaturas (endpoint/chaves
-- são o suficiente para outro serviço mandar push falso para aquele
-- navegador, então não expomos via select público). O envio em si
-- roda a partir de uma server action do admin autenticado, que já
-- consegue ler via is_championship_admin.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_championship_id_idx
  on public.push_subscriptions (championship_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_select_admin" on public.push_subscriptions for select
  using (is_championship_admin(championship_id));

create policy "push_subscriptions_insert_public" on public.push_subscriptions for insert
  with check (true);

create policy "push_subscriptions_delete_admin" on public.push_subscriptions for delete
  using (is_championship_admin(championship_id));
