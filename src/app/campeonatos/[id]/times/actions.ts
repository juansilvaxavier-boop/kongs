"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";

function parseCoachId(formData: FormData) {
  const value = String(formData.get("coach_id") || "");
  return value ? value : null;
}

async function assertCoachBelongsToChampionship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  coachId: string | null
) {
  if (!coachId) return;

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("id", coachId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("O técnico selecionado não pertence a este campeonato.");
}

export async function createTeam(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do time.");

  const coachId = parseCoachId(formData);
  const supabase = await createClient();
  await assertCoachBelongsToChampionship(supabase, championshipId, coachId);

  const { error } = await supabase.from("teams").insert({
    championship_id: championshipId,
    name,
    coach_id: coachId,
  });

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function updateTeam(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do time.");

  const coachId = parseCoachId(formData);
  const supabase = await createClient();
  await assertCoachBelongsToChampionship(supabase, championshipId, coachId);

  const { data, error } = await supabase
    .from("teams")
    .update({ name, coach_id: coachId })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Time não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deleteTeam(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}
