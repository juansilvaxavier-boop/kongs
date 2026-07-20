-- ============================================================
-- Controle financeiro completo: receitas e despesas do campeonato
-- (mensalidades de times, patrocínio, despesas de arbitragem/local
-- etc.), além dos pagamentos de arbitragem já rastreados em games.
-- Só o admin do campeonato acessa.
-- ============================================================
create table if not exists public.financial_entries (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  type text not null check (type in ('receita', 'despesa')),
  category text not null,
  description text,
  amount numeric(10, 2) not null check (amount >= 0),
  team_id uuid references public.teams(id) on delete set null,
  paid boolean not null default true,
  entry_date date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists idx_financial_entries_championship
  on public.financial_entries(championship_id);
create index if not exists idx_financial_entries_team
  on public.financial_entries(team_id);

alter table public.financial_entries enable row level security;

create policy "financial_entries_select_admin" on public.financial_entries
  for select using (is_championship_admin(financial_entries.championship_id));

create policy "financial_entries_insert_admin" on public.financial_entries
  for insert with check (is_championship_admin(financial_entries.championship_id));

create policy "financial_entries_update_admin" on public.financial_entries
  for update
  using (is_championship_admin(financial_entries.championship_id))
  with check (is_championship_admin(financial_entries.championship_id));

create policy "financial_entries_delete_admin" on public.financial_entries
  for delete using (is_championship_admin(financial_entries.championship_id));
