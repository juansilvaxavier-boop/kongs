"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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

export async function createPlayer(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({
    championship_id: championshipId,
    name,
    team_id: parseTeamId(formData),
    number: parseNumber(formData),
    position: parsePosition(formData),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/jogadores`);
}

export async function updatePlayer(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("players")
    .update({
      name,
      team_id: parseTeamId(formData),
      number: parseNumber(formData),
      position: parsePosition(formData),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/jogadores`);
}

export async function deletePlayer(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/jogadores`);
}
