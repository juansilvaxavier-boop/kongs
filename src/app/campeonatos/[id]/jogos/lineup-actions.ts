"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { runAction, type ActionResult } from "@/lib/action-result";

async function assertPlayerBelongsToGame(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  gameId: string,
  playerId: string
) {
  const { data: game, error: gameError } = await supabase
    .from("games")
    .select("team_a_id, team_b_id")
    .eq("id", gameId)
    .eq("championship_id", championshipId)
    .maybeSingle();

  if (gameError) throw new Error(gameError.message);
  if (!game) throw new Error("Jogo não encontrado.");

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("team_id")
    .eq("id", playerId)
    .maybeSingle();

  if (playerError) throw new Error(playerError.message);
  if (
    !player ||
    (player.team_id !== game.team_a_id && player.team_id !== game.team_b_id)
  ) {
    throw new Error("O jogador selecionado não faz parte de nenhum dos times deste jogo.");
  }
}

export async function toggleLineupPlayer(
  gameId: string,
  championshipId: string,
  playerId: string,
  confirmed: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    await assertPlayerBelongsToGame(supabase, championshipId, gameId, playerId);

    const { error } = await supabase
      .from("game_lineups")
      .upsert(
        { championship_id: championshipId, game_id: gameId, player_id: playerId, confirmed },
        { onConflict: "game_id,player_id" }
      );
    if (error) throw new Error(error.message);

    revalidateChampionship(championshipId);
  });
}

export async function setShirtNumber(
  gameId: string,
  championshipId: string,
  playerId: string,
  shirtNumber: number | null
): Promise<ActionResult> {
  return runAction(async () => {
    if (shirtNumber !== null && (shirtNumber < 0 || shirtNumber > 999)) {
      throw new Error("Número de camisa inválido.");
    }

    const supabase = await createClient();
    await assertPlayerBelongsToGame(supabase, championshipId, gameId, playerId);

    // Insere a linha só se ela ainda não existir (sem mexer em
    // "confirmed" nesse caso — fica false, o default de linha nova),
    // e depois atualiza só a coluna shirt_number. Antes isto lia
    // "confirmed" e regravava ele junto num upsert só, o que corria o
    // risco de reverter uma confirmação feita bem na hora (o toggle do
    // checkbox e este salvamento em lote do botão "Salvar súmula"
    // podem ficar em voo ao mesmo tempo).
    const { error: insertError } = await supabase.from("game_lineups").upsert(
      {
        championship_id: championshipId,
        game_id: gameId,
        player_id: playerId,
        confirmed: false,
        shirt_number: shirtNumber,
      },
      { onConflict: "game_id,player_id", ignoreDuplicates: true }
    );
    if (insertError) throw new Error(insertError.message);

    const { error } = await supabase
      .from("game_lineups")
      .update({ shirt_number: shirtNumber })
      .eq("game_id", gameId)
      .eq("player_id", playerId);
    if (error) throw new Error(error.message);

    revalidateChampionship(championshipId);
  });
}

async function assertTeamBelongsToGame(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  gameId: string,
  teamId: string
) {
  const { data: game, error } = await supabase
    .from("games")
    .select("team_a_id, team_b_id")
    .eq("id", gameId)
    .eq("championship_id", championshipId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!game || (teamId !== game.team_a_id && teamId !== game.team_b_id)) {
    throw new Error("Time inválido para este jogo.");
  }
}

export async function signCaptain(
  gameId: string,
  championshipId: string,
  teamId: string,
  captainName: string,
  signatureDataUrl: string
): Promise<ActionResult> {
  return runAction(async () => {
    if (!captainName.trim()) throw new Error("Informe o nome do capitão.");
    if (!signatureDataUrl) throw new Error("Assinatura inválida.");

    const supabase = await createClient();
    await assertTeamBelongsToGame(supabase, championshipId, gameId, teamId);
    const { error } = await supabase.from("game_captain_signatures").upsert(
      {
        championship_id: championshipId,
        game_id: gameId,
        team_id: teamId,
        captain_name: captainName.trim(),
        signature_data_url: signatureDataUrl,
        signed_at: new Date().toISOString(),
      },
      { onConflict: "game_id,team_id" }
    );
    if (error) throw new Error(error.message);

    revalidateChampionship(championshipId);
  });
}
