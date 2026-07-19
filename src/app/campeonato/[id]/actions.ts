"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function postComment(championshipId: string, formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Você precisa entrar na sua conta para comentar.");

  const body = String(formData.get("body") || "").trim();
  if (!body) throw new Error("Escreva um comentário antes de enviar.");
  if (body.length > 2000) throw new Error("Comentário muito longo (máx. 2000 caracteres).");

  const { error } = await supabase.from("championship_comments").insert({
    championship_id: championshipId,
    user_id: user.id,
    body,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/campeonato/${championshipId}`);
}

export async function deleteComment(championshipId: string, commentId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("championship_comments")
    .delete()
    .eq("id", commentId);
  if (error) throw new Error(error.message);

  revalidatePath(`/campeonato/${championshipId}`);
}

export async function subscribeToPush(
  championshipId: string,
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } }
) {
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").insert({
    championship_id: championshipId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
  });
  // 23505 = endpoint já cadastrado (usuário assinando de novo no mesmo navegador) — ok, ignora.
  if (error && error.code !== "23505") throw new Error(error.message);
}
