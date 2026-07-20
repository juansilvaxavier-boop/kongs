"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";

export type FavoriteKind = "game" | "team" | "player";

export async function toggleFavorite(
  kind: FavoriteKind,
  entityId: string,
  currentlyFavorited: boolean
): Promise<ActionResult<boolean>> {
  return runAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Você precisa entrar na sua conta para favoritar.");

    if (currentlyFavorited) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("kind", kind)
        .eq("entity_id", entityId);
      if (error) throw new Error(error.message);
      revalidatePath("/favoritos");
      return false;
    }

    const { error } = await supabase.from("favorites").insert({
      user_id: user.id,
      kind,
      entity_id: entityId,
    });
    // 23505 = já favoritado (clique duplo, outra aba, etc.) — ok, ignora.
    if (error && error.code !== "23505") throw new Error(error.message);
    revalidatePath("/favoritos");
    return true;
  });
}
