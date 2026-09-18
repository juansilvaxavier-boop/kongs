-- Súmula em PDF: cabeçalho com logo, nome, edição, fase e cidade do
-- campeonato. "edição" e "cidade" ainda não existiam como campo —
-- viram colunas de texto simples, opcionais, editáveis na aba
-- Configurações do campeonato (mesmo padrão de rules_text). "Fase" não
-- precisa de campo novo: já é o round do próprio jogo.
alter table public.championships
  add column if not exists edition text,
  add column if not exists city text;

-- sumula_get_championship (rota pública/mesário) precisa devolver
-- edition/city/logo_url também, pra montar o mesmo cabeçalho no PDF
-- baixado pelo link sem login.
drop function if exists public.sumula_get_championship(uuid);

create function public.sumula_get_championship(p_token uuid)
returns table (
  championship_id uuid,
  championship_name text,
  edition text,
  city text,
  logo_url text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_championship_id uuid;
begin
  select cst.championship_id into v_championship_id
  from public.championship_sumula_tokens cst
  where cst.token = p_token;

  if v_championship_id is null then
    raise exception 'Link inválido.';
  end if;

  return query
  select c.id, c.name, c.edition, c.city, c.logo_url
  from public.championships c
  where c.id = v_championship_id;
end;
$$;

revoke all on function public.sumula_get_championship(uuid) from public;
grant execute on function public.sumula_get_championship(uuid) to anon, authenticated;
