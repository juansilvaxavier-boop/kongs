-- Cadastro de árbitros por campeonato (nome + CPF), atribuídos
-- opcionalmente a um jogo com valor e status de pagamento. CPF é dado
-- sensível (documento pessoal) e não tem utilidade pública — ao
-- contrário de venues/coaches, a tabela inteira (inclusive select) é
-- restrita ao admin do campeonato.
create table if not exists public.referees (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  name text not null,
  cpf text,
  created_at timestamptz not null default now()
);

create index if not exists referees_championship_id_idx on public.referees (championship_id);
create unique index if not exists referees_championship_cpf_unique
  on public.referees (championship_id, cpf) where cpf is not null;

alter table public.referees enable row level security;

create policy "referees_select_admin" on public.referees for select
  using (is_championship_admin(championship_id));

create policy "referees_insert_admin" on public.referees for insert
  with check (is_championship_admin(championship_id));

create policy "referees_update_admin" on public.referees for update
  using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));

create policy "referees_delete_admin" on public.referees for delete
  using (is_championship_admin(championship_id));

alter table public.games
  add column if not exists referee_id uuid references public.referees(id) on delete set null,
  add column if not exists referee_payment_amount numeric(10, 2),
  add column if not exists referee_paid boolean not null default false;
