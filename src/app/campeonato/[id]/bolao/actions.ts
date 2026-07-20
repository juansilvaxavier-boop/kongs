"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";

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
