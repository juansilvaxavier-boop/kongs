"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { runAction, type ActionResult } from "@/lib/action-result";
import { processGameOvr } from "./ovr-processing";

function parseMinute(formData: FormData) {
  const value = String(formData.get("minute") || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function assertPlayerBelongsToGame(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  gameId: string,
  playerId: string
) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("team_a_id, team_b_id")
    .eq("id", gameId)
    .eq("championship_id", championshipId)
    .maybeSingle();

  if (gameError) throw new Error(gameError.message);
  if (!game) throw new Error("Jogo não encontrado.");

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .maybeSingle();

  if (playerError) throw new Error(playerError.message);
  if (
    !player ||
    (player.team_id !== game.team_a_id && player.team_id !== game.team_b_id)
  ) {
    throw new Error("O jogador selecionado não faz parte de nenhum dos times deste jogo.");
  }
}

export async function createGoalEvent(
  gameId: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const playerId = String(formData.get("player_id") || "");
    if (!playerId) throw new Error("Selecione o jogador.");

    const supabase = await createClient();
    await assertPlayerBelongsToGame(supabase, championshipId, gameId, playerId);

    const { error } = await supabase.from("goal_events").insert({
      championship_id: championshipId,
      game_id: gameId,
      player_id: playerId,
      minute: parseMinute(formData),
    });

    if (error) throw new Error(error.message);
    await processGameOvr(supabase, gameId);
    revalidateChampionship(championshipId);
  });
}

export async function deleteGoalEvent(
  id: string,
  championshipId: string,
  gameId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("goal_events").delete().eq("id", id);

    if (error) throw new Error(error.message);
    await processGameOvr(supabase, gameId);
    revalidateChampionship(championshipId);
  });
}

export async function createCardEvent(
  gameId: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const playerId = String(formData.get("player_id") || "");
    const cardType = String(formData.get("card_type") || "");
    if (!playerId) throw new Error("Selecione o jogador.");
    if (cardType !== "yellow" && cardType !== "red") {
      throw new Error("Selecione o tipo de cartão.");
    }

    const supabase = await createClient();
    await assertPlayerBelongsToGame(supabase, championshipId, gameId, playerId);

    const { error } = await supabase.from("card_events").insert({
      championship_id: championshipId,
      game_id: gameId,
      player_id: playerId,
      card_type: cardType,
      minute: parseMinute(formData),
    });

    if (error) throw new Error(error.message);
    await processGameOvr(supabase, gameId);
    revalidateChampionship(championshipId);
  });
}

export async function deleteCardEvent(
  id: string,
  championshipId: string,
  gameId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("card_events").delete().eq("id", id);

    if (error) throw new Error(error.message);
    await processGameOvr(supabase, gameId);
    revalidateChampionship(championshipId);
  });
}
