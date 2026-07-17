import { createClient } from "@/lib/supabase/server";

/**
 * Reprocessa os efeitos de OVR de uma partida de forma idempotente. A lógica
 * (fórmulas em src/lib/gamification.ts) roda como função SQL
 * (`process_game_ovr`, SECURITY DEFINER) para que o mesmo motor sirva tanto
 * o admin quanto o link público de súmula, sem precisar de service role key.
 */
export async function processGameOvr(
  supabase: Awaited<ReturnType<typeof createClient>>,
  gameId: string
) {
  const { error } = await supabase.rpc("process_game_ovr", { p_game_id: gameId });
  if (error) throw new Error(error.message);
}
