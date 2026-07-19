"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { parsePositiveIntOrNull } from "@/lib/forms";

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

  const teamCount = parsePositiveIntOrNull(formData, "team_count", "Quantidade de times");
  const groupCount = parsePositiveIntOrNull(formData, "group_count", "Quantidade de grupos");
  const rulesText = String(formData.get("rules_text") || "").trim();

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("championships")
    .update({
      format,
      has_knockout_stage: hasKnockoutStage,
      yellow_cards_for_suspension: Math.trunc(yellowThreshold),
      team_count: teamCount,
      group_count: groupCount,
      rules_text: rulesText ? rulesText : null,
    })
    .eq("id", championshipId)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Campeonato não encontrado ou sem permissão para editar.");

  revalidateChampionship(championshipId);
}
