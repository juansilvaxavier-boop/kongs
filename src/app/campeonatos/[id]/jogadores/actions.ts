"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";

function parseTeamId(formData: FormData) {
  const value = String(formData.get("team_id") || "");
  return value ? value : null;
}

function parseNumber(formData: FormData) {
  const value = String(formData.get("number") || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePosition(formData: FormData) {
  const value = String(formData.get("position") || "").trim();
  return value ? value : null;
}

async function assertTeamBelongsToChampionship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  teamId: string | null
) {
  if (!teamId) return;

  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("id", teamId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("O time selecionado não pertence a este campeonato.");
}

export async function createPlayer(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do jogador.");

  const teamId = parseTeamId(formData);
  const supabase = await createClient();
  await assertTeamBelongsToChampionship(supabase, championshipId, teamId);

  const { error } = await supabase.from("players").insert({
    championship_id: championshipId,
    name,
    team_id: teamId,
    number: parseNumber(formData),
    position: parsePosition(formData),
  });

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function updatePlayer(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do jogador.");

  const teamId = parseTeamId(formData);
  const supabase = await createClient();
  await assertTeamBelongsToChampionship(supabase, championshipId, teamId);

  const { data, error } = await supabase
    .from("players")
    .update({
      name,
      team_id: teamId,
      number: parseNumber(formData),
      position: parsePosition(formData),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Jogador não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deletePlayer(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}
