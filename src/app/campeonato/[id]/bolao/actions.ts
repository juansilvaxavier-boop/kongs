"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";
import { computeBolaoPredictionTier } from "@/lib/bolao";

async function currentBolaoPredictionTier(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string
) {
  const [{ data: championship }, { data: games }] = await Promise.all([
    supabase
      .from("championships")
      .select("has_knockout_stage")
      .eq("id", championshipId)
      .maybeSingle(),
    supabase.from("games").select("round, played").eq("championship_id", championshipId),
  ]);
  return computeBolaoPredictionTier(championship?.has_knockout_stage ?? false, games ?? []);
}

export async function upsertPrediction(
  championshipId: string,
  gameId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para dar seu palpite.");

    const scoreA = Number(formData.get("predicted_score_a"));
    const scoreB = Number(formData.get("predicted_score_b"));
    if (!Number.isInteger(scoreA) || scoreA < 0 || !Number.isInteger(scoreB) || scoreB < 0) {
      throw new Error("Informe um placar válido.");
    }

    const { error } = await supabase.from("bolao_predictions").upsert(
      {
        championship_id: championshipId,
        game_id: gameId,
        user_id: user.id,
        predicted_score_a: scoreA,
        predicted_score_b: scoreB,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "game_id,user_id" }
    );
    if (error) throw new Error(error.message);

    revalidatePath(`/campeonato/${championshipId}/bolao`);
    revalidatePath(`/campeonato/${championshipId}/partidas/${gameId}`);
  });
}

export async function upsertGroupPrediction(
  championshipId: string,
  groupName: string | null,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para dar seu palpite.");

    const picks: { position: number; teamId: string }[] = [];
    for (const [key, value] of formData.entries()) {
      const match = /^position_(\d+)$/.exec(key);
      if (!match || typeof value !== "string" || !value) continue;
      picks.push({ position: Number(match[1]), teamId: value });
    }

    const teamsQuery = supabase
      .from("teams")
      .select("id")
      .eq("championship_id", championshipId);
    const { data: groupTeams, error: teamsError } =
      groupName === null
        ? await teamsQuery.is("group_name", null)
        : await teamsQuery.eq("group_name", groupName);
    if (teamsError) throw new Error(teamsError.message);

    const groupTeamIds = new Set((groupTeams ?? []).map((t) => t.id));
    if (picks.some((p) => !groupTeamIds.has(p.teamId))) {
      throw new Error("Um dos times escolhidos não pertence a este grupo.");
    }
    if (new Set(picks.map((p) => p.teamId)).size !== picks.length) {
      throw new Error("Você não pode escolher o mesmo time em mais de uma posição.");
    }

    const groupTeamIdArray = [...groupTeamIds];
    if (groupTeamIdArray.length > 0) {
      const { data: playedGroupGames, error: lockError } = await supabase
        .from("games")
        .select("id")
        .eq("championship_id", championshipId)
        .eq("played", true)
        .in("team_a_id", groupTeamIdArray)
        .in("team_b_id", groupTeamIdArray)
        .limit(1);
      if (lockError) throw new Error(lockError.message);
      if (playedGroupGames && playedGroupGames.length > 0) {
        throw new Error("Este grupo já começou — não é mais possível alterar o palpite.");
      }
    }

    const deleteQuery = supabase
      .from("bolao_group_predictions")
      .delete()
      .eq("championship_id", championshipId)
      .eq("user_id", user.id);
    const { error: deleteError } =
      groupName === null
        ? await deleteQuery.is("group_name", null)
        : await deleteQuery.eq("group_name", groupName);
    if (deleteError) throw new Error(deleteError.message);

    if (picks.length > 0) {
      const { error: insertError } = await supabase.from("bolao_group_predictions").insert(
        picks.map((p) => ({
          championship_id: championshipId,
          user_id: user.id,
          group_name: groupName,
          position: p.position,
          team_id: p.teamId,
        }))
      );
      if (insertError) throw new Error(insertError.message);
    }

    revalidatePath(`/campeonato/${championshipId}/bolao`);
  });
}

export async function upsertTopscorerPrediction(
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para dar seu palpite.");

    const playerId = String(formData.get("player_id") || "");
    if (!playerId) throw new Error("Selecione um jogador.");

    const points = await currentBolaoPredictionTier(supabase, championshipId);

    const { error } = await supabase.from("bolao_topscorer_predictions").upsert(
      {
        championship_id: championshipId,
        user_id: user.id,
        player_id: playerId,
        points,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "championship_id,user_id" }
    );
    if (error) throw new Error(error.message);

    revalidatePath(`/campeonato/${championshipId}/bolao`);
  });
}

export async function upsertChampionPrediction(
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para dar seu palpite.");

    const teamId = String(formData.get("team_id") || "");
    if (!teamId) throw new Error("Selecione um time.");

    const points = await currentBolaoPredictionTier(supabase, championshipId);

    const { error } = await supabase.from("bolao_champion_predictions").upsert(
      {
        championship_id: championshipId,
        user_id: user.id,
        team_id: teamId,
        points,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "championship_id,user_id" }
    );
    if (error) throw new Error(error.message);

    revalidatePath(`/campeonato/${championshipId}/bolao`);
  });
}
