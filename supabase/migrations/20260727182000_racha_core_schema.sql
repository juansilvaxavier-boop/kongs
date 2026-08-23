-- Núcleo do Kong's Game (racha): configuração de preço (mensal/diária),
-- sessões (com estado do cronômetro) e confirmação de presença. Tudo
-- reaproveitando o toolchain já existente (times/jogadores/jogos/eventos de
-- gol e cartão/financeiro) via is_championship_admin(), sem duplicar RLS.

alter table public.players
  add column if not exists payment_plan text
  check (payment_plan is null or payment_plan in ('mensal', 'diaria'));

alter table public.financial_entries
  add column if not exists player_id uuid references public.players(id) on delete set null;

create index if not exists idx_financial_entries_player on public.financial_entries(player_id);

create table if not exists public.racha_settings (
  championship_id uuid primary key references public.championships(id) on delete cascade,
  monthly_price numeric(10, 2) not null default 0 check (monthly_price >= 0),
  daily_price numeric(10, 2) not null default 0 check (daily_price >= 0),
  updated_at timestamptz not null default now()
);

alter table public.racha_settings enable row level security;

create policy "racha_settings_select_public" on public.racha_settings
  for select using (true);
create policy "racha_settings_insert_admin" on public.racha_settings
  for insert with check (is_championship_admin(championship_id));
create policy "racha_settings_update_admin" on public.racha_settings
  for update using (is_championship_admin(championship_id)) with check (is_championship_admin(championship_id));

create table if not exists public.racha_sessions (
  id uuid primary key default gen_random_uuid(),
  championship_id uuid not null references public.championships(id) on delete cascade,
  session_date date not null default current_date,
  status text not null default 'agendado'
    check (status in ('agendado', 'sorteio_feito', 'em_andamento', 'encerrado')),
  game_id uuid references public.games(id) on delete set null,
  clock_status text not null default 'parado' check (clock_status in ('parado', 'rodando', 'pausado')),
  clock_started_at timestamptz,
  clock_accumulated_seconds int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_racha_sessions_championship on public.racha_sessions(championship_id);

alter table public.racha_sessions enable row level security;

create policy "racha_sessions_select_public" on public.racha_sessions
  for select using (true);
create policy "racha_sessions_insert_admin" on public.racha_sessions
  for insert with check (is_championship_admin(championship_id));
create policy "racha_sessions_update_admin" on public.racha_sessions
  for update using (is_championship_admin(championship_id)) with check (is_championship_admin(championship_id));
create policy "racha_sessions_delete_admin" on public.racha_sessions
  for delete using (is_championship_admin(championship_id));

create table if not exists public.racha_session_confirmations (
  session_id uuid not null references public.racha_sessions(id) on delete cascade,
  championship_id uuid not null references public.championships(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  confirmed boolean not null default false,
  confirmed_at timestamptz,
  primary key (session_id, player_id)
);

create index if not exists idx_racha_confirmations_player on public.racha_session_confirmations(player_id);

alter table public.racha_session_confirmations enable row level security;

create policy "racha_confirmations_select_public" on public.racha_session_confirmations
  for select using (true);
create policy "racha_confirmations_write_admin" on public.racha_session_confirmations
  for all using (is_championship_admin(championship_id)) with check (is_championship_admin(championship_id));

-- Confirmação de presença é feita pelo próprio jogador (via player_id
-- ligado ao seu user_id) através desta função — evita expor player_id
-- direto ao cliente (que poderia tentar confirmar por outra pessoa) e, se
-- o plano do jogador for "diária", já lança a cobrança pendente no
-- financeiro (evitando cobrar duas vezes na mesma data).
create or replace function public.racha_confirm_attendance(p_session_id uuid, p_confirmed boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
  v_session_date date;
  v_player_id uuid;
  v_plan text;
  v_daily_price numeric;
begin
  select championship_id, session_date into v_championship_id, v_session_date
  from public.racha_sessions where id = p_session_id;
  if v_championship_id is null then
    raise exception 'Sessão não encontrada.';
  end if;

  select id, payment_plan into v_player_id, v_plan
  from public.players
  where championship_id = v_championship_id and user_id = (select auth.uid());
  if v_player_id is null then
    raise exception 'Você não está registrado neste racha.';
  end if;

  insert into public.racha_session_confirmations (session_id, championship_id, player_id, confirmed, confirmed_at)
  values (p_session_id, v_championship_id, v_player_id, p_confirmed, case when p_confirmed then now() else null end)
  on conflict (session_id, player_id) do update
    set confirmed = excluded.confirmed, confirmed_at = excluded.confirmed_at;

  if p_confirmed and v_plan = 'diaria' then
    select daily_price into v_daily_price from public.racha_settings where championship_id = v_championship_id;
    if v_daily_price is not null and v_daily_price > 0 and not exists (
      select 1 from public.financial_entries
      where championship_id = v_championship_id
        and player_id = v_player_id
        and category = 'Diária'
        and entry_date = v_session_date
    ) then
      insert into public.financial_entries
        (championship_id, type, category, description, amount, player_id, entry_date, paid_amount)
      values
        (v_championship_id, 'receita', 'Diária', 'Diária do racha', v_daily_price, v_player_id, v_session_date, 0);
    end if;
  end if;
end;
$$;

revoke all on function public.racha_confirm_attendance(uuid, boolean) from public;
revoke execute on function public.racha_confirm_attendance(uuid, boolean) from anon;
grant execute on function public.racha_confirm_attendance(uuid, boolean) to authenticated;
