"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { isAdmin } from "@/lib/auth/roles";

export async function createChampionship(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do campeonato.");

  const format = String(formData.get("format") || "liga");
  if (format !== "liga" && format !== "copa") {
    throw new Error("Formato inválido.");
  }
  const hasKnockoutStage = formData.get("has_knockout_stage") === "on";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isAdmin(supabase))) {
    throw new Error("Apenas a organização pode criar campeonatos.");
  }

  const { data, error } = await supabase
    .from("championships")
    .insert({
      name,
      owner_id: user.id,
      format,
      has_knockout_stage: hasKnockoutStage,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/campeonatos");
  redirect(`/campeonatos/${data.id}/classificacao`);
}

export async function renameChampionship(id: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do campeonato.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("championships")
    .update({ name })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Campeonato não encontrado ou sem permissão para editar.");

  revalidatePath("/campeonatos");
  revalidateChampionship(id);
}

export async function deleteChampionship(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("championships").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/campeonatos");
}
