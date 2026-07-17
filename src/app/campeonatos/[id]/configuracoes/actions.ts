"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";

export async function updateChampionshipSettings(
  championshipId: string,
  formData: FormData
) {
  const format = String(formData.get("format") || "liga");
  if (format !== "liga" && format !== "copa") {
    throw new Error("Formato inválido.");
  }

  const hasKnockoutStage = formData.get("has_knockout_stage") === "on";

  const yellowThreshold = Number(formData.get("yellow_cards_for_suspension"));
  if (!Number.isFinite(yellowThreshold) || yellowThreshold < 1) {
    throw new Error("Informe um número válido de cartões amarelos (mínimo 1).");
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("championships")
    .update({
      format,
      has_knockout_stage: hasKnockoutStage,
      yellow_cards_for_suspension: Math.trunc(yellowThreshold),
    })
    .eq("id", championshipId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Campeonato não encontrado ou sem permissão para editar.");

  revalidateChampionship(championshipId);
}
