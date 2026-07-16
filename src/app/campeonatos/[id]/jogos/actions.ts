"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";

function parseDate(formData: FormData) {
  const value = String(formData.get("date") || "");
  return value ? value : null;
}

function parseScore(formData: FormData, field: "score_a" | "score_b") {
  const value = String(formData.get(field) || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function assertTeamsBelongToChampionship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  teamAId: string,
  teamBId: string
) {
  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .eq("championship_id", championshipId)
    .in("id", [teamAId, teamBId]);

  if (error) throw new Error(error.message);
  if (!data || data.length !== 2) {
    throw new Error("Os times selecionados não pertencem a este campeonato.");
  }
}

export async function createGame(championshipId: string, formData: FormData) {
  const round = String(formData.get("round") || "").trim();
  const teamAId = String(formData.get("team_a_id") || "");
  const teamBId = String(formData.get("team_b_id") || "");

  if (!round || !teamAId || !teamBId) {
    throw new Error("Preencha a rodada e os dois times.");
  }
  if (teamAId === teamBId) {
    throw new Error("Escolha dois times diferentes.");
  }

  const supabase = await createClient();
  await assertTeamsBelongToChampionship(supabase, championshipId, teamAId, teamBId);

  const { error } = await supabase.from("games").insert({
    championship_id: championshipId,
    round,
    team_a_id: teamAId,
    team_b_id: teamBId,
    date: parseDate(formData),
  });

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function updateGame(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const round = String(formData.get("round") || "").trim();
  const teamAId = String(formData.get("team_a_id") || "");
  const teamBId = String(formData.get("team_b_id") || "");

  if (!round || !teamAId || !teamBId) {
    throw new Error("Preencha a rodada e os dois times.");
  }
  if (teamAId === teamBId) {
    throw new Error("Escolha dois times diferentes.");
  }

  const scoreA = parseScore(formData, "score_a");
  const scoreB = parseScore(formData, "score_b");
  const played = formData.get("played") === "on";

  if (played && (scoreA === null || scoreB === null)) {
    throw new Error("Informe o placar dos dois times para marcar o jogo como realizado.");
  }

  const supabase = await createClient();
  await assertTeamsBelongToChampionship(supabase, championshipId, teamAId, teamBId);

  const { data, error } = await supabase
    .from("games")
    .update({
      round,
      team_a_id: teamAId,
      team_b_id: teamBId,
      date: parseDate(formData),
      score_a: scoreA,
      score_b: scoreB,
      played,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Jogo não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deleteGame(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}
