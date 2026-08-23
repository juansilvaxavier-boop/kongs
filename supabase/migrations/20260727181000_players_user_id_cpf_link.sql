-- CPF obrigatório no cadastro: guarda em profiles.cpf, e vincula
-- automaticamente (só leitura, sem conceder nenhum privilégio de escrita)
-- a qualquer jogador já cadastrado num elenco com o mesmo CPF — útil tanto
-- pra mostrar "você já está registrado no time X" quanto, mais adiante,
-- pra permitir que jogadores de racha confirmem presença como eles mesmos.
--
-- Importante: só reivindica linhas de players ainda sem user_id (nunca
-- rouba um vínculo já feito), e CPF nunca concede acesso de escrita —
-- é só identificação, não autenticação.
alter table public.profiles
  add column if not exists cpf text;

alter table public.players
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_players_user_id on public.players(user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cpf text;
begin
  v_cpf := regexp_replace(coalesce(new.raw_user_meta_data->>'cpf', ''), '\D', '', 'g');

  insert into public.profiles (user_id, phone, cpf)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data->>'phone'), ''),
    nullif(v_cpf, '')
  )
  on conflict (user_id) do nothing;

  if v_cpf <> '' then
    update public.players
    set user_id = new.id
    where document_type = 'cpf'
      and document_number = v_cpf
      and user_id is null;
  end if;

  return new;
end;
$$;

-- Jogador de racha se auto-cadastra (sem precisar de admin/link de elenco) —
-- só em campeonatos kind='racha', e só criando a própria linha (user_id
-- precisa ser o próprio usuário autenticado).
create policy "players_insert_self_racha" on public.players
  for insert with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.championships c
      where c.id = players.championship_id and c.kind = 'racha'
    )
  );
