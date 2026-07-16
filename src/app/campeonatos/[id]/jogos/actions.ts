"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseDate(formData: FormData) {
  const value = String(formData.get("date") || "");
  if (!value) return null;
  return new Date(value).toISOString();
}

function parseScore(formData: FormData, field: "score_a" | "score_b") {
  const value = String(formData.get(field) || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function revalidateAll(championshipId: string) {
  revalidatePath(`/campeonatos/${championshipId}/jogos`);
  revalidatePath(`/campeonatos/${championshipId}/classificacao`);
}

export async function createGame(championshipId: string, formData: FormData) {
  const round = String(formData.get("round") || "").trim();
  const teamAId = String(formData.get("team_a_id") || "");
  const teamBId = String(formData.get("team_b_id") || "");

  if (!round || !teamAId || !teamBId || teamAId === teamBId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("games").insert({
    championship_id: championshipId,
    round,
    team_a_id: teamAId,
    team_b_id: teamBId,
    date: parseDate(formData),
  });

  if (error) throw new Error(error.message);
  revalidateAll(championshipId);
}

export async function updateGame(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const round = String(formData.get("round") || "").trim();
  const teamAId = String(formData.get("team_a_id") || "");
  const teamBId = String(formData.get("team_b_id") || "");

  if (!round || !teamAId || !teamBId || teamAId === teamBId) return;

  const scoreA = parseScore(formData, "score_a");
  const scoreB = parseScore(formData, "score_b");
  const played = formData.get("played") === "on";

  const supabase = await createClient();
  const { error } = await supabase
    .from("games")
    .update({
      round,
      team_a_id: teamAId,
      team_b_id: teamBId,
      date: parseDate(formData),
      score_a: scoreA,
      score_b: scoreB,
      played: played && scoreA !== null && scoreB !== null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateAll(championshipId);
}

export async function deleteGame(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateAll(championshipId);
}
