"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseMinute(formData: FormData): number {
  const value = String(formData.get("minute") || "");
  if (!value) return null as unknown as number;
  const parsed = Number(value);
  return (Number.isFinite(parsed) ? parsed : null) as unknown as number;
}

export async function sumulaAddGoal(token: string, gameId: string, formData: FormData) {
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
}

export async function sumulaDeleteGoal(token: string, gameId: string, goalId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_delete_goal", {
    p_token: token,
    p_goal_id: goalId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}/${gameId}`);
}

export async function sumulaAddCard(token: string, gameId: string, formData: FormData) {
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
}

export async function sumulaDeleteCard(token: string, gameId: string, cardId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_delete_card", {
    p_token: token,
    p_card_id: cardId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}/${gameId}`);
}

export async function sumulaSetPlayed(token: string, gameId: string, played: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_set_played", {
    p_token: token,
    p_game_id: gameId,
    p_played: played,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}/${gameId}`);
}
