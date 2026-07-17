"use server";

import { createClient } from "@/lib/supabase/server";
import { assignTeamsToGroups, shuffle } from "@/lib/groups";
import { revalidateChampionship } from "@/lib/revalidate";

export async function sortearGrupos(championshipId: string) {
  const supabase = await createClient();

  const { data: championship, error: championshipError } = await supabase
    .from("championships")
    .select("format, group_count")
    .eq("id", championshipId)
    .maybeSingle();
  if (championshipError) throw new Error(championshipError.message);
  if (!championship) throw new Error("Campeonato não encontrado.");
  if (championship.format !== "copa") {
    throw new Error("O sorteio de grupos só está disponível para o formato Copa.");
  }
  if (!championship.group_count) {
    throw new Error(
      "Defina a quantidade de grupos em Configurações antes de sortear."
    );
  }

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("championship_id", championshipId);
  if (teamsError) throw new Error(teamsError.message);
  if (!teams || teams.length === 0) {
    throw new Error("Nenhum time cadastrado para sortear.");
  }

  const shuffledIds = shuffle(teams.map((team) => team.id));
  const assignment = assignTeamsToGroups(shuffledIds, championship.group_count);

  for (const [teamId, groupName] of assignment) {
    const { error } = await supabase
      .from("teams")
      .update({ group_name: groupName })
      .eq("id", teamId);
    if (error) throw new Error(error.message);
  }

  revalidateChampionship(championshipId);
}
