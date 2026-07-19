-- Habilita Realtime (postgres_changes) para o modo telão: placar ao
-- vivo sem precisar dar refresh na página. RLS continua valendo nas
-- mudanças transmitidas — como games/goal_events/card_events já têm
-- select público (using true), isso não expõe nada que a página
-- pública já não mostrasse.
alter publication supabase_realtime add table public.games;
alter publication supabase_realtime add table public.goal_events;
alter publication supabase_realtime add table public.card_events;
