"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { isAdmin } from "@/lib/auth/roles";
import { parsePositiveIntOrNull } from "@/lib/forms";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function createChampionship(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // redirect() lança um erro especial que o Next intercepta para navegar —
  // não pode ficar dentro do try/catch do runAction, ou seria engolido
  // e tratado como uma falha normal em vez de navegar.
  if (!user) redirect("/login");

  const result = await runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do campeonato.");

    const format = String(formData.get("format") || "liga");
    if (format !== "liga" && format !== "copa") {
      throw new Error("Formato inválido.");
    }
    const hasKnockoutStage = formData.get("has_knockout_stage") === "on";
    const teamCount = parsePositiveIntOrNull(formData, "team_count", "Quantidade de times");
    const groupCount = parsePositiveIntOrNull(formData, "group_count", "Quantidade de grupos");

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
        team_count: teamCount,
        group_count: groupCount,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    revalidatePath("/campeonatos");
    return data.id;
  });

  if (!result.ok) return result;
  redirect(`/campeonatos/${result.data}/classificacao`);
}

export async function renameChampionship(id: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
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
  });
}

export async function deleteChampionship(id: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("championships").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/campeonatos");
  });
}
