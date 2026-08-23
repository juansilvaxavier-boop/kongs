"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";
import { computeBalancedTeams } from "@/lib/racha-draft";
import { computeElapsedSeconds, type RachaClockStatus } from "@/lib/racha-clock";

type Supabase = Awaited<ReturnType<typeof createClient>>;

async function requireRachaAdmin(supabase: Supabase, championshipId: string) {
  const { data, error } = await supabase.rpc("is_championship_admin", {
    p_championship_id: championshipId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Sem permissão para gerenciar este racha.");
}

export async function updateRachaSettings(
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);

    const monthlyPrice = Number(formData.get("monthly_price"));
    const dailyPrice = Number(formData.get("daily_price"));
    if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) throw new Error("Valor mensal inválido.");
    if (!Number.isFinite(dailyPrice) || dailyPrice < 0) throw new Error("Valor diário inválido.");

    const { error } = await supabase
      .from("racha_settings")
      .update({ monthly_price: monthlyPrice, daily_price: dailyPrice })
      .eq("championship_id", championshipId);
    if (error) throw new Error(error.message);

    revalidatePath(`/racha/${championshipId}/gerenciar`);
  });
}

export async function createRachaSession(
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);

    const sessionDate = String(formData.get("session_date") || "");
    if (!sessionDate) throw new Error("Informe a data.");

    const { error } = await supabase
      .from("racha_sessions")
      .insert({ championship_id: championshipId, session_date: sessionDate });
    if (error) throw new Error(error.message);

    revalidatePath(`/racha/${championshipId}/gerenciar`);
  });
}

export async function runRachaDraft(championshipId: string, sessionId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .eq("championship_id", championshipId)
      .order("name");
    if (teamsError) throw new Error(teamsError.message);
    if (!teams || teams.length < 2) throw new Error("Times não encontrados.");
    const [teamA, teamB] = teams;

    const { data: confirmations, error: confError } = await supabase
      .from("racha_session_confirmations")
      .select("player_id")
      .eq("session_id", sessionId)
      .eq("confirmed", true);
    if (confError) throw new Error(confError.message);

    const confirmedIds = (confirmations ?? []).map((c) => c.player_id);
    if (confirmedIds.length === 0) throw new Error("Nenhum jogador confirmou presença ainda.");

    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id, position, player_attributes(ovr)")
      .in("id", confirmedIds);
    if (playersError) throw new Error(playersError.message);

    const draftInput = (players ?? []).map((p) => {
      const attrs = Array.isArray(p.player_attributes) ? p.player_attributes[0] : p.player_attributes;
      return { id: p.id, position: p.position, ovr: attrs?.ovr ?? 70 };
    });
    const { teamA: teamAIds, teamB: teamBIds } = computeBalancedTeams(draftInput);

    if (teamAIds.length > 0) {
      const { error } = await supabase.from("players").update({ team_id: teamA.id }).in("id", teamAIds);
      if (error) throw new Error(error.message);
    }
    if (teamBIds.length > 0) {
      const { error } = await supabase.from("players").update({ team_id: teamB.id }).in("id", teamBIds);
      if (error) throw new Error(error.message);
    }

    const { error: sessionError } = await supabase
      .from("racha_sessions")
      .update({ status: "sorteio_feito" })
      .eq("id", sessionId);
    if (sessionError) throw new Error(sessionError.message);

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}

async function ensureSessionGame(
  supabase: Supabase,
  championshipId: string,
  sessionId: string
): Promise<string> {
  const { data: session, error } = await supabase
    .from("racha_sessions")
    .select("game_id, session_date")
    .eq("id", sessionId)
    .single();
  if (error) throw new Error(error.message);
  if (session.game_id) return session.game_id;

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id")
    .eq("championship_id", championshipId)
    .order("name");
  if (teamsError) throw new Error(teamsError.message);
  if (!teams || teams.length < 2) throw new Error("Times não encontrados.");

  const { data: game, error: gameError } = await supabase
    .from("games")
    .insert({
      championship_id: championshipId,
      round: "Racha",
      team_a_id: teams[0].id,
      team_b_id: teams[1].id,
      date: session.session_date,
      score_a: 0,
      score_b: 0,
    })
    .select("id")
    .single();
  if (gameError) throw new Error(gameError.message);

  const { error: updateError } = await supabase
    .from("racha_sessions")
    .update({ game_id: game.id })
    .eq("id", sessionId);
  if (updateError) throw new Error(updateError.message);

  return game.id;
}

export async function startRachaClock(championshipId: string, sessionId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);
    await ensureSessionGame(supabase, championshipId, sessionId);

    const { error } = await supabase
      .from("racha_sessions")
      .update({
        clock_status: "rodando",
        clock_started_at: new Date().toISOString(),
        status: "em_andamento",
      })
      .eq("id", sessionId);
    if (error) throw new Error(error.message);

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}

export async function pauseRachaClock(championshipId: string, sessionId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);

    const { data: session, error: fetchError } = await supabase
      .from("racha_sessions")
      .select("clock_status, clock_started_at, clock_accumulated_seconds")
      .eq("id", sessionId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const elapsed = computeElapsedSeconds(
      session.clock_status as RachaClockStatus,
      session.clock_started_at,
      session.clock_accumulated_seconds
    );

    const { error } = await supabase
      .from("racha_sessions")
      .update({ clock_status: "pausado", clock_started_at: null, clock_accumulated_seconds: elapsed })
      .eq("id", sessionId);
    if (error) throw new Error(error.message);

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}

export async function endRachaSession(championshipId: string, sessionId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);

    const { data: session, error: fetchError } = await supabase
      .from("racha_sessions")
      .select("clock_status, clock_started_at, clock_accumulated_seconds, game_id")
      .eq("id", sessionId)
      .single();
    if (fetchError) throw new Error(fetchError.message);

    const elapsed = computeElapsedSeconds(
      session.clock_status as RachaClockStatus,
      session.clock_started_at,
      session.clock_accumulated_seconds
    );

    const { error } = await supabase
      .from("racha_sessions")
      .update({
        status: "encerrado",
        clock_status: "parado",
        clock_started_at: null,
        clock_accumulated_seconds: elapsed,
      })
      .eq("id", sessionId);
    if (error) throw new Error(error.message);

    if (session.game_id) {
      const { error: gameError } = await supabase
        .from("games")
        .update({ played: true })
        .eq("id", session.game_id);
      if (gameError) throw new Error(gameError.message);
    }

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}

async function adjustGameScore(
  supabase: Supabase,
  gameId: string,
  teamId: string | null,
  delta: number
): Promise<void> {
  const { data: game, error } = await supabase
    .from("games")
    .select("team_a_id, team_b_id, score_a, score_b")
    .eq("id", gameId)
    .single();
  if (error) throw new Error(error.message);

  const isTeamA = teamId === game.team_a_id;
  const isTeamB = teamId === game.team_b_id;
  if (!isTeamA && !isTeamB) return;

  const { error: updateError } = await supabase
    .from("games")
    .update({
      score_a: isTeamA ? Math.max(0, (game.score_a ?? 0) + delta) : game.score_a,
      score_b: isTeamB ? Math.max(0, (game.score_b ?? 0) + delta) : game.score_b,
    })
    .eq("id", gameId);
  if (updateError) throw new Error(updateError.message);
}

export async function logRachaGoal(
  championshipId: string,
  sessionId: string,
  playerId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);
    const gameId = await ensureSessionGame(supabase, championshipId, sessionId);

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("team_id")
      .eq("id", playerId)
      .single();
    if (playerError) throw new Error(playerError.message);

    const { error: insertError } = await supabase
      .from("goal_events")
      .insert({ championship_id: championshipId, game_id: gameId, player_id: playerId });
    if (insertError) throw new Error(insertError.message);

    await adjustGameScore(supabase, gameId, player.team_id, 1);

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}

export async function undoLastRachaGoal(
  championshipId: string,
  sessionId: string,
  playerId: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);
    const gameId = await ensureSessionGame(supabase, championshipId, sessionId);

    const { data: lastGoal, error: findError } = await supabase
      .from("goal_events")
      .select("id")
      .eq("game_id", gameId)
      .eq("player_id", playerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (findError) throw new Error(findError.message);
    if (!lastGoal) return;

    const { data: player, error: playerError } = await supabase
      .from("players")
      .select("team_id")
      .eq("id", playerId)
      .single();
    if (playerError) throw new Error(playerError.message);

    const { error: deleteError } = await supabase.from("goal_events").delete().eq("id", lastGoal.id);
    if (deleteError) throw new Error(deleteError.message);

    await adjustGameScore(supabase, gameId, player.team_id, -1);

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}

export async function logRachaCard(
  championshipId: string,
  sessionId: string,
  playerId: string,
  cardType: "yellow" | "red"
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await requireRachaAdmin(supabase, championshipId);
    const gameId = await ensureSessionGame(supabase, championshipId, sessionId);

    const { error } = await supabase
      .from("card_events")
      .insert({ championship_id: championshipId, game_id: gameId, player_id: playerId, card_type: cardType });
    if (error) throw new Error(error.message);

    revalidatePath(`/racha/${championshipId}/gerenciar/${sessionId}`);
  });
}
