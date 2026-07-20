"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";

export async function upsertRefereeRating(
  championshipId: string,
  gameId: string,
  teamId: string,
  refereeId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para avaliar a arbitragem.");

    const rating = Number(formData.get("rating"));
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Escolha uma nota de 1 a 5.");
    }
    const comment = String(formData.get("comment") || "").trim();

    const { error } = await supabase.from("referee_ratings").upsert(
      {
        championship_id: championshipId,
        game_id: gameId,
        team_id: teamId,
        referee_id: refereeId,
        rating,
        comment: comment || null,
      },
      { onConflict: "game_id,team_id" }
    );
    if (error) throw new Error(error.message);

    revalidatePath(`/campeonato/${championshipId}/partidas/${gameId}`);
  });
}
