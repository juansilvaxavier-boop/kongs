-- Kong's League (campeonato, o produto de hoje) vs Kong's Game (racha, novo
-- produto informal): as duas convivem na mesma tabela championships,
-- distinguidas por `kind`. Racha pode ser criado por qualquer usuário
-- autenticado (sem exigir admin/permissão), então precisa de política de
-- insert própria — mas o resto do toolchain admin (times, jogadores, jogos,
-- gols/cartões, financeiro) é 100% reaproveitado estendendo
-- is_championship_admin() com um único OR, em vez de reescrever dezenas de
-- políticas.
alter table public.championships
  add column if not exists kind text not null default 'campeonato'
  check (kind in ('campeonato', 'racha'));

create or replace function public.is_championship_admin(p_championship_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.championships c
    where c.id = p_championship_id
      and c.owner_id = (select auth.uid())
      and (public.is_admin() or c.kind = 'racha')
  )
  or exists (
    select 1 from public.championship_admins ca
    where ca.championship_id = p_championship_id
      and ca.user_id = (select auth.uid())
  );
$$;

drop policy if exists "championships_insert_admin" on public.championships;
create policy "championships_insert_admin" on public.championships
  for insert with check (
    kind = 'campeonato'
    and (is_admin() or has_permission('manage_championships'))
    and (owner_id = (select auth.uid()))
  );

create policy "championships_insert_racha_any_user" on public.championships
  for insert with check (
    kind = 'racha'
    and owner_id = (select auth.uid())
  );
