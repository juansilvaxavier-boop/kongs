"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// As funções SQL aceitam int nulo (gol/cartão sem minuto, placar em branco),
// mas o gerador de tipos do Supabase não marca argumentos de RPC como
// nuláveis — daí o cast explícito nos pontos de chamada abaixo.
function parseMinute(formData: FormData): number {
  const value = String(formData.get("minute") || "");
  if (!value) return null as unknown as number;
  const parsed = Number(value);
  return (Number.isFinite(parsed) ? parsed : null) as unknown as number;
}

function parseScore(formData: FormData, field: "score_a" | "score_b"): number {
  const value = String(formData.get(field) || "");
  if (!value) return null as unknown as number;
  const parsed = Number(value);
  return (Number.isFinite(parsed) ? parsed : null) as unknown as number;
}

export async function sumulaUpdateScore(token: string, formData: FormData) {
  const scoreA = parseScore(formData, "score_a");
  const scoreB = parseScore(formData, "score_b");
  const played = formData.get("played") === "on";

  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_update_score", {
    p_token: token,
    p_score_a: scoreA,
    p_score_b: scoreB,
    p_played: played,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}`);
}

export async function sumulaAddGoal(token: string, formData: FormData) {
  const playerId = String(formData.get("player_id") || "");
  if (!playerId) throw new Error("Selecione o jogador.");

  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_add_goal", {
    p_token: token,
    p_player_id: playerId,
    p_minute: parseMinute(formData),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}`);
}

export async function sumulaDeleteGoal(token: string, goalId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_delete_goal", {
    p_token: token,
    p_goal_id: goalId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}`);
}

export async function sumulaAddCard(token: string, formData: FormData) {
  const playerId = String(formData.get("player_id") || "");
  const cardType = String(formData.get("card_type") || "");
  if (!playerId) throw new Error("Selecione o jogador.");
  if (cardType !== "yellow" && cardType !== "red") {
    throw new Error("Selecione o tipo de cartão.");
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_add_card", {
    p_token: token,
    p_player_id: playerId,
    p_card_type: cardType,
    p_minute: parseMinute(formData),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}`);
}

export async function sumulaDeleteCard(token: string, cardId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("sumula_delete_card", {
    p_token: token,
    p_card_id: cardId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/sumula/${token}`);
}
