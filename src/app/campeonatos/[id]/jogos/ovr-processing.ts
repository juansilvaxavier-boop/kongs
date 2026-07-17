import { createClient } from "@/lib/supabase/server";
import {
  clampAttribute,
  computeOvrLedger,
  sumLedger,
  type Position,
  type PlayerGameStats,
} from "@/lib/gamification";

const VALID_POSITIONS: Position[] = [
  "Goleiro",
  "Zagueiro",
  "Lateral",
  "Volante",
  "Meia",
  "Atacante",
];

function normalizePosition(position: string | null): Position {
  return (VALID_POSITIONS as string[]).includes(position ?? "")
    ? (position as Position)
    : "Meia";
}

/**
 * Reprocessa os efeitos de OVR de uma partida de forma idempotente: desfaz
 * qualquer lançamento anterior daquela partida (revertendo o OVR/atributos
 * dos jogadores envolvidos) e, se a partida estiver marcada como realizada,
 * recalcula tudo do zero a partir dos dados atuais da súmula (placar, gols
 * e cartões), aplicando as fórmulas do sistema de gamificação e definindo o
 * craque da partida (maior ΔOVR).
 */
export async function processGameOvr(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  gameId: string
) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("id, team_a_id, team_b_id, score_a, score_b, played, round")
    .eq("id", gameId)
    .maybeSingle();
  if (gameError) throw new Error(gameError.message);
  if (!game) return;

  const { data: previousEntries, error: previousError } = await supabase
    .from("ovr_history")
    .select("player_id, delta")
    .eq("game_id", gameId);
  if (previousError) throw new Error(previousError.message);

  if (previousEntries && previousEntries.length > 0) {
    const previousTotals = new Map<string, number>();
    for (const entry of previousEntries) {
      previousTotals.set(entry.player_id, (previousTotals.get(entry.player_id) ?? 0) + entry.delta);
    }
    for (const [playerId, total] of previousTotals) {
      await adjustPlayerAttributes(supabase, playerId, -total);
    }

    const { error: deleteError } = await supabase
      .from("ovr_history")
      .delete()
      .eq("game_id", gameId);
    if (deleteError) throw new Error(deleteError.message);
  }

  if (!game.played || game.score_a === null || game.score_b === null) {
    const { error } = await supabase
      .from("games")
      .update({ mvp_player_id: null, ovr_processed_at: null })
      .eq("id", gameId);
    if (error) throw new Error(error.message);
    return;
  }

  const [{ data: players, error: playersError }, { data: goals, error: goalsError }, { data: cards, error: cardsError }] =
    await Promise.all([
      supabase
        .from("players")
        .select("id, team_id, position")
        .in("team_id", [game.team_a_id, game.team_b_id]),
      supabase.from("goal_events").select("player_id").eq("game_id", gameId),
      supabase.from("card_events").select("player_id, card_type").eq("game_id", gameId),
    ]);
  if (playersError) throw new Error(playersError.message);
  if (goalsError) throw new Error(goalsError.message);
  if (cardsError) throw new Error(cardsError.message);

  const goalCounts = new Map<string, number>();
  for (const goal of goals ?? []) {
    goalCounts.set(goal.player_id, (goalCounts.get(goal.player_id) ?? 0) + 1);
  }
  const yellowCounts = new Map<string, number>();
  const redCounts = new Map<string, number>();
  for (const card of cards ?? []) {
    const counts = card.card_type === "red" ? redCounts : yellowCounts;
    counts.set(card.player_id, (counts.get(card.player_id) ?? 0) + 1);
  }

  const winnerTeamId =
    game.score_a > game.score_b
      ? game.team_a_id
      : game.score_b > game.score_a
        ? game.team_b_id
        : null;

  let mvpPlayerId: string | null = null;
  let mvpDelta = -Infinity;

  for (const player of players ?? []) {
    const goalsConceded = player.team_id === game.team_a_id ? game.score_b : game.score_a;

    const stats: PlayerGameStats = {
      goals: goalCounts.get(player.id) ?? 0,
      won: player.team_id !== null && player.team_id === winnerTeamId,
      yellowCards: yellowCounts.get(player.id) ?? 0,
      redCards: redCounts.get(player.id) ?? 0,
      goalsConceded,
      position: normalizePosition(player.position),
    };

    const entries = computeOvrLedger(stats);
    if (entries.length === 0) continue;

    const total = sumLedger(entries);
    if (total > mvpDelta) {
      mvpDelta = total;
      mvpPlayerId = player.id;
    }

    const { error: insertError } = await supabase.from("ovr_history").insert(
      entries.map((entry) => ({
        player_id: player.id,
        championship_id: championshipId,
        game_id: gameId,
        round: game.round,
        reason: entry.reason,
        delta: entry.delta,
      }))
    );
    if (insertError) throw new Error(insertError.message);

    await adjustPlayerAttributes(supabase, player.id, total);
  }

  const { error: updateGameError } = await supabase
    .from("games")
    .update({ mvp_player_id: mvpPlayerId, ovr_processed_at: new Date().toISOString() })
    .eq("id", gameId);
  if (updateGameError) throw new Error(updateGameError.message);
}

async function adjustPlayerAttributes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
  delta: number
) {
  if (delta === 0) return;

  const { data: attributes, error } = await supabase
    .from("player_attributes")
    .select("ovr, ritmo, finalizacao, passe, drible, defesa, fisico")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!attributes) return;

  const { error: updateError } = await supabase
    .from("player_attributes")
    .update({
      ovr: clampAttribute(attributes.ovr + delta),
      ritmo: clampAttribute(attributes.ritmo + delta),
      finalizacao: clampAttribute(attributes.finalizacao + delta),
      passe: clampAttribute(attributes.passe + delta),
      drible: clampAttribute(attributes.drible + delta),
      defesa: clampAttribute(attributes.defesa + delta),
      fisico: clampAttribute(attributes.fisico + delta),
      updated_at: new Date().toISOString(),
    })
    .eq("player_id", playerId);
  if (updateError) throw new Error(updateError.message);
}
