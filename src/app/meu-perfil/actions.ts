"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PERSONAS = ["jogador", "treinador", "torcedor"] as const;

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const displayName = String(formData.get("display_name") || "").trim();
  const avatarUrl = String(formData.get("avatar_url") || "").trim();
  const persona = String(formData.get("persona") || "");

  if (!displayName) throw new Error("Informe seu nome.");
  if (!PERSONAS.includes(persona as (typeof PERSONAS)[number])) {
    throw new Error("Selecione se você é jogador, treinador ou torcedor.");
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    display_name: displayName,
    avatar_url: avatarUrl || null,
    persona,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/meu-perfil");
}
