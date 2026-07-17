"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { generateRoundRobin } from "@/lib/round-robin";
import { groupTeamsByFormat, shuffle } from "@/lib/groups";

function parseDate(formData: FormData) {
  const value = String(formData.get("date") || "");
  return value ? value : null;
}

function parseScore(formData: FormData, field: "score_a" | "score_b") {
  const value = String(formData.get(field) || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

async function assertTeamsBelongToChampionship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  teamAId: string,
  teamBId: string
) {
  const { data, error } = await supabase
    .from("teams")
    .select("id")
    .eq("championship_id", championshipId)
    .in("id", [teamAId, teamBId]);

  if (error) throw new Error(error.message);
  if (!data || data.length !== 2) {
    throw new Error("Os times selecionados não pertencem a este campeonato.");
  }
}

export async function createGame(championshipId: string, formData: FormData) {
  const round = String(formData.get("round") || "").trim();
  const teamAId = String(formData.get("team_a_id") || "");
  const teamBId = String(formData.get("team_b_id") || "");

  if (!round || !teamAId || !teamBId) {
    throw new Error("Preencha a rodada e os dois times.");
  }
  if (teamAId === teamBId) {
    throw new Error("Escolha dois times diferentes.");
  }

  const supabase = await createClient();
  await assertTeamsBelongToChampionship(supabase, championshipId, teamAId, teamBId);

  const { error } = await supabase.from("games").insert({
    championship_id: championshipId,
    round,
    team_a_id: teamAId,
    team_b_id: teamBId,
    date: parseDate(formData),
  });

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function updateGame(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const round = String(formData.get("round") || "").trim();
  const teamAId = String(formData.get("team_a_id") || "");
  const teamBId = String(formData.get("team_b_id") || "");

  if (!round || !teamAId || !teamBId) {
    throw new Error("Preencha a rodada e os dois times.");
  }
  if (teamAId === teamBId) {
    throw new Error("Escolha dois times diferentes.");
  }

  const scoreA = parseScore(formData, "score_a");
  const scoreB = parseScore(formData, "score_b");
  const played = formData.get("played") === "on";

  if (played && (scoreA === null || scoreB === null)) {
    throw new Error("Informe o placar dos dois times para marcar o jogo como realizado.");
  }

  const supabase = await createClient();
  await assertTeamsBelongToChampionship(supabase, championshipId, teamAId, teamBId);

  const { data, error } = await supabase
    .from("games")
    .update({
      round,
      team_a_id: teamAId,
      team_b_id: teamBId,
      date: parseDate(formData),
      score_a: scoreA,
      score_b: scoreB,
      played,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Jogo não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export type GeneratedGamePreview = {
  round: string;
  teamAName: string;
  teamBName: string;
};

export async function generateRounds(
  championshipId: string,
  formData: FormData
): Promise<GeneratedGamePreview[]> {
  const rounds = Number(formData.get("rounds") || "1");
  if (!Number.isFinite(rounds) || rounds < 1) {
    throw new Error(
      "Informe quantas vezes cada time deve enfrentar o mesmo adversário (mínimo 1)."
    );
  }

  const supabase = await createClient();
  const [{ data: championship }, { data: teams, error: teamsError }] = await Promise.all([
    supabase
      .from("championships")
      .select("format")
      .eq("id", championshipId)
      .maybeSingle(),
    supabase
      .from("teams")
      .select("id, name, group_name")
      .eq("championship_id", championshipId)
      .order("name"),
  ]);

  if (teamsError) throw new Error(teamsError.message);
  if (!teams || teams.length < 2) {
    throw new Error("Cadastre ao menos dois times para gerar as rodadas.");
  }

  const pools = groupTeamsByFormat(championship?.format ?? "liga", teams);
  const teamNameById = new Map(teams.map((t) => [t.id, t.name]));

  const gamesToInsert: {
    championship_id: string;
    round: string;
    team_a_id: string;
    team_b_id: string;
  }[] = [];
  const preview: GeneratedGamePreview[] = [];

  for (const pool of pools) {
    if (pool.teams.length < 2) continue;

    const shuffledTeamIds = shuffle(pool.teams.map((t) => t.id));
    const fixtures = generateRoundRobin(shuffledTeamIds, Math.trunc(rounds));

    for (const fixture of fixtures) {
      const roundLabel = pool.groupName
        ? `${pool.groupName} - Rodada ${fixture.round}`
        : `Rodada ${fixture.round}`;

      gamesToInsert.push({
        championship_id: championshipId,
        round: roundLabel,
        team_a_id: fixture.teamAId,
        team_b_id: fixture.teamBId,
      });
      preview.push({
        round: roundLabel,
        teamAName: teamNameById.get(fixture.teamAId) ?? "?",
        teamBName: teamNameById.get(fixture.teamBId) ?? "?",
      });
    }
  }

  if (gamesToInsert.length === 0) {
    throw new Error("Nenhum grupo tem times suficientes para gerar jogos.");
  }

  const { error } = await supabase.from("games").insert(gamesToInsert);
  if (error) throw new Error(error.message);

  revalidateChampionship(championshipId);
  return preview;
}

export async function deleteGame(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("games").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}
