"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createCoach(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("coaches")
    .insert({ championship_id: championshipId, name });

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/tecnicos`);
}

export async function updateCoach(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase.from("coaches").update({ name }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/tecnicos`);
}

export async function deleteCoach(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("coaches").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath(`/campeonatos/${championshipId}/tecnicos`);
  revalidatePath(`/campeonatos/${championshipId}/times`);
}
