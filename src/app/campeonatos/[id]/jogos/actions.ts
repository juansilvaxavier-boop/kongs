"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { getSiteUrl } from "@/lib/site-url";
import { generateRoundRobinForTotalRounds } from "@/lib/round-robin";
import { groupTeamsByFormat, shuffle } from "@/lib/groups";
import { runAction, type ActionResult } from "@/lib/action-result";
import { processGameOvr } from "./ovr-processing";
import { notifyChampionshipSubscribers } from "./push-notify";

function parseDate(formData: FormData) {
  const value = String(formData.get("date") || "");
  return value ? value : null;
}

function parseVenueId(formData: FormData) {
  const value = String(formData.get("venue_id") || "");
  return value ? value : null;
}

function parseRefereeId(formData: FormData) {
  const value = String(formData.get("referee_id") || "");
  return value ? value : null;
}

function parseRefereePaymentAmount(formData: FormData) {
  const value = String(formData.get("referee_payment_amount") || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRefereePaid(formData: FormData) {
  return formData.get("referee_paid") === "on";
}

function parseCpf(formData: FormData): string | null {
  const raw = String(formData.get("cpf") || "").trim();
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 11) throw new Error("CPF precisa ter 11 dígitos.");
  return digits;
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

export async function createGame(championshipId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
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

    const { count } = await supabase
      .from("games")
      .select("id", { count: "exact", head: true })
      .eq("championship_id", championshipId);
    const hasDrawnGames = (count ?? 0) > 0;

    const { error } = await supabase.from("games").insert({
      championship_id: championshipId,
      round,
      team_a_id: teamAId,
      team_b_id: teamBId,
      date: hasDrawnGames ? parseDate(formData) : null,
      venue_id: parseVenueId(formData),
      referee_id: parseRefereeId(formData),
      referee_payment_amount: parseRefereePaymentAmount(formData),
      referee_paid: parseRefereePaid(formData),
    });

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function updateGame(
  id: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
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

    const { data, error } = await supabase
      .from("games")
      .update({
        round,
        team_a_id: teamAId,
        team_b_id: teamBId,
        date: parseDate(formData),
        venue_id: parseVenueId(formData),
        referee_id: parseRefereeId(formData),
        referee_payment_amount: parseRefereePaymentAmount(formData),
        referee_paid: parseRefereePaid(formData),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Jogo não encontrado ou sem permissão para editar.");

    revalidateChampionship(championshipId);
  });
}

export async function setGamePlayed(
  id: string,
  championshipId: string,
  played: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("games")
      .update({ played })
      .eq("id", id)
      .eq("championship_id", championshipId)
      .select("id, round, team_a_id, team_b_id, score_a, score_b")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Jogo não encontrado ou sem permissão para editar.");

    await processGameOvr(supabase, id);
    revalidateChampionship(championshipId);

    if (played) {
      const { data: teams } = await supabase
        .from("teams")
        .select("id, name")
        .in("id", [data.team_a_id, data.team_b_id]);
      const teamName = (teamId: string) => teams?.find((t) => t.id === teamId)?.name ?? "?";

      await notifyChampionshipSubscribers(
        supabase,
        championshipId,
        "Resultado publicado!",
        `${teamName(data.team_a_id)} ${data.score_a ?? 0} x ${data.score_b ?? 0} ${teamName(data.team_b_id)} (${data.round})`,
        `/campeonato/${championshipId}/partidas`
      );
    }
  });
}

export async function getChampionshipSumulaLink(championshipId: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_or_create_championship_sumula_token", {
      p_championship_id: championshipId,
    });
    if (error) throw new Error(error.message);
    return `${getSiteUrl()}/sumula/${data}`;
  });
}

export async function regenerateChampionshipSumulaLink(
  championshipId: string
): Promise<ActionResult<string>> {
  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("regenerate_championship_sumula_token", {
      p_championship_id: championshipId,
    });
    if (error) throw new Error(error.message);
    return `${getSiteUrl()}/sumula/${data}`;
  });
}

export type GeneratedGamePreview = {
  round: string;
  teamAName: string;
  teamBName: string;
};

export async function generateRounds(
  championshipId: string,
  formData: FormData
): Promise<ActionResult<GeneratedGamePreview[]>> {
  return runAction(async () => {
    const totalRounds = Number(formData.get("rounds") || "1");
    if (!Number.isFinite(totalRounds) || totalRounds < 1) {
      throw new Error("Informe quantas rodadas a fase de grupos deve ter (mínimo 1).");
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
      const fixtures = generateRoundRobinForTotalRounds(
        shuffledTeamIds,
        Math.trunc(totalRounds)
      );

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
  });
}

export async function deleteGame(id: string, championshipId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("games").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function deleteAllGames(championshipId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("games")
      .delete()
      .eq("championship_id", championshipId);

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function createVenue(championshipId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do local.");
    const address = String(formData.get("address") || "").trim();

    const supabase = await createClient();
    const { error } = await supabase.from("venues").insert({
      championship_id: championshipId,
      name,
      address: address ? address : null,
    });

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function updateVenue(
  id: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do local.");
    const address = String(formData.get("address") || "").trim();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("venues")
      .update({ name, address: address ? address : null })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Local não encontrado ou sem permissão para editar.");
    revalidateChampionship(championshipId);
  });
}

export async function deleteVenue(id: string, championshipId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("venues").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

async function assertRefereeCpfNotDuplicated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  cpf: string | null,
  excludeRefereeId?: string
) {
  if (!cpf) return;

  let query = supabase
    .from("referees")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("cpf", cpf);
  if (excludeRefereeId) query = query.neq("id", excludeRefereeId);

  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  if (data && data.length > 0) {
    throw new Error("Já existe um árbitro cadastrado com este CPF neste campeonato.");
  }
}

export async function createReferee(championshipId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do árbitro.");
    const cpf = parseCpf(formData);

    const supabase = await createClient();
    await assertRefereeCpfNotDuplicated(supabase, championshipId, cpf);
    const { error } = await supabase.from("referees").insert({
      championship_id: championshipId,
      name,
      cpf,
    });

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function updateReferee(
  id: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do árbitro.");
    const cpf = parseCpf(formData);

    const supabase = await createClient();
    await assertRefereeCpfNotDuplicated(supabase, championshipId, cpf, id);
    const { data, error } = await supabase
      .from("referees")
      .update({ name, cpf })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Árbitro não encontrado ou sem permissão para editar.");
    revalidateChampionship(championshipId);
  });
}

export async function deleteReferee(id: string, championshipId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("referees").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}
