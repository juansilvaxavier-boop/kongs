-- Pagamento parcial nos lançamentos financeiros: em vez de um booleano
-- "pago", cada lançamento agora guarda quanto já foi efetivamente pago
-- (paid_amount). O status (pago/parcial/pendente) é derivado disso na
-- aplicação (ver src/lib/financial.ts), nunca guardado separado, pra
-- não ter como os dois ficarem inconsistentes entre si.
alter table public.financial_entries
  add column if not exists paid_amount numeric(10, 2) not null default 0;

update public.financial_entries
  set paid_amount = amount
  where paid = true and paid_amount = 0;

alter table public.financial_entries
  add constraint financial_entries_paid_amount_range
  check (paid_amount >= 0 and paid_amount <= amount);

alter table public.financial_entries
  drop column if exists paid;
