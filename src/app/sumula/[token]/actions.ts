"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyChampionshipSubscribers } from "@/app/campeonatos/[id]/jogos/push-notify";
import { runAction, type ActionResult } from "@/lib/action-result";

function parseMinute(formData: FormData): number {
  const value = String(formData.get("minute") || "");
  if (!value) return null as unknown as number;
  const parsed = Number(value);
  return (Number.isFinite(parsed) ? parsed : null) as unknown as number;
}

export async function sumulaAddGoal(
  token: string,
  gameId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const playerId = String(formData.get("player_id") || "");
    if (!playerId) throw new Error("Selecione o jogador.");

    const supabase = await createClient();
    const { error } = await supabase.rpc("sumula_add_goal", {
      p_token: token,
      p_game_id: gameId,
      p_player_id: playerId,
      p_minute: parseMinute(formData),
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);
  });
}

export async function sumulaDeleteGoal(
  token: string,
  gameId: string,
  goalId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("sumula_delete_goal", {
      p_token: token,
      p_goal_id: goalId,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);
  });
}

export async function sumulaAddCard(
  token: string,
  gameId: string,
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
    const { error } = await supabase.rpc("sumula_add_card", {
      p_token: token,
      p_game_id: gameId,
      p_player_id: playerId,
      p_card_type: cardType,
      p_minute: parseMinute(formData),
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);
  });
}

export async function sumulaDeleteCard(
  token: string,
  gameId: string,
  cardId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("sumula_delete_card", {
      p_token: token,
      p_card_id: cardId,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);
  });
}

export async function sumulaSetPlayed(
  token: string,
  gameId: string,
  played: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("sumula_set_played", {
      p_token: token,
      p_game_id: gameId,
      p_played: played,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);

    if (played) {
      const { data: game } = await supabase
        .from("games")
        .select("championship_id, round, team_a_id, team_b_id, score_a, score_b")
        .eq("id", gameId)
        .maybeSingle();

      if (game) {
        const { data: teams } = await supabase
          .from("teams")
          .select("id, name")
          .in("id", [game.team_a_id, game.team_b_id]);
        const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";

        await notifyChampionshipSubscribers(
          supabase,
          game.championship_id,
          "Resultado publicado!",
          `${teamName(game.team_a_id)} ${game.score_a ?? 0} x ${game.score_b ?? 0} ${teamName(game.team_b_id)} (${game.round})`,
          `/campeonato/${game.championship_id}/partidas`
        );
      }
    }
  });
}

export async function sumulaToggleLineup(
  token: string,
  gameId: string,
  playerId: string,
  confirmed: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("sumula_toggle_lineup", {
      p_token: token,
      p_game_id: gameId,
      p_player_id: playerId,
      p_confirmed: confirmed,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);
  });
}

export async function sumulaSignCaptain(
  token: string,
  gameId: string,
  teamId: string,
  captainName: string,
  signatureDataUrl: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("sumula_sign_captain", {
      p_token: token,
      p_game_id: gameId,
      p_team_id: teamId,
      p_captain_name: captainName,
      p_signature_data_url: signatureDataUrl,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/sumula/${token}/${gameId}`);
  });
}
