"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function parseCoachId(formData: FormData) {
  const value = String(formData.get("coach_id") || "");
  return value ? value : null;
}

export async function createTeam(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("teams").insert({
    championship_id: championshipId,
    name,
    coach_id: parseCoachId(formData),
  });

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/times`);
}

export async function updateTeam(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("teams")
    .update({ name, coach_id: parseCoachId(formData) })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/times`);
}

export async function deleteTeam(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/times`);
  revalidatePath(`/campeonatos/${championshipId}/jogadores`);
  revalidatePath(`/campeonatos/${championshipId}/jogos`);
  revalidatePath(`/campeonatos/${championshipId}/classificacao`);
}
