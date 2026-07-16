-- "for all" nas policies de goal_events/card_events duplicava a avaliação
-- de SELECT (já coberta por goal_events_select_public / card_events_select_public),
-- gerando "multiple permissive policies" para a mesma ação. Divide em
-- insert/update/delete específicos.
drop policy if exists "goal_events_write_admin" on public.goal_events;
create policy "goal_events_insert_admin" on public.goal_events
  for insert with check (is_championship_admin(championship_id));
create policy "goal_events_update_admin" on public.goal_events
  for update using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));
create policy "goal_events_delete_admin" on public.goal_events
  for delete using (is_championship_admin(championship_id));

drop policy if exists "card_events_write_admin" on public.card_events;
create policy "card_events_insert_admin" on public.card_events
  for insert with check (is_championship_admin(championship_id));
create policy "card_events_update_admin" on public.card_events
  for update using (is_championship_admin(championship_id))
  with check (is_championship_admin(championship_id));
create policy "card_events_delete_admin" on public.card_events
  for delete using (is_championship_admin(championship_id));
