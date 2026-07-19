import { createClient } from "@/lib/supabase/server";

/**
 * Reprocessa os efeitos de OVR de uma partida de forma idempotente. A lógica
 * (fórmulas em src/lib/gamification.ts) roda como função SQL
 * (`process_game_ovr`, SECURITY DEFINER) para que o mesmo motor sirva tanto
 * o admin quanto o link público de súmula, sem precisar de service role key.
 *
 * `process_game_ovr` não tem EXECUTE liberado para anon/authenticated (só é
 * chamável de dentro de outra função SECURITY DEFINER, como as sumula_*, que
 * já validam o token). O admin passa por este portão
 * (`admin_process_game_ovr`), que confere is_championship_admin antes de
 * chamar o motor.
 */
export async function processGameOvr(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameId: string
) {
  const { error } = await supabase.rpc("admin_process_game_ovr", { p_game_id: gameId });
  if (error) throw new Error(error.message);
}
