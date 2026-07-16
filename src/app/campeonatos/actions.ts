"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createChampionship(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("championships")
    .insert({ name, owner_id: user.id })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/campeonatos");
  redirect(`/campeonatos/${data.id}/classificacao`);
}

export async function renameChampionship(id: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from("championships")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/campeonatos");
  revalidatePath(`/campeonatos/${id}`);
}

export async function deleteChampionship(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("championships").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/campeonatos");
}
