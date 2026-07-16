"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";

export async function createCoach(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do técnico.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("coaches")
    .insert({ championship_id: championshipId, name });

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function updateCoach(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do técnico.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coaches")
    .update({ name })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Técnico não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deleteCoach(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}
