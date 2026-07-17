"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PERSONAS = ["jogador", "treinador", "torcedor"] as const;
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado.");

  const firstName = String(formData.get("first_name") || "").trim();
  const lastName = String(formData.get("last_name") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const persona = String(formData.get("persona") || "");

  if (!firstName) throw new Error("Informe seu nome.");
  if (!PERSONAS.includes(persona as (typeof PERSONAS)[number])) {
    throw new Error("Selecione se você é jogador, treinador ou torcedor.");
  }

  let avatarUrl: string | undefined;
  const avatarFile = formData.get("avatar");
  if (avatarFile instanceof File && avatarFile.size > 0) {
    if (!avatarFile.type.startsWith("image/")) {
      throw new Error("A foto precisa ser um arquivo de imagem.");
    }
    if (avatarFile.size > MAX_AVATAR_BYTES) {
      throw new Error("A foto precisa ter no máximo 5MB.");
    }
    const extension = avatarFile.name.split(".").pop() || "jpg";
    const path = `${user.id}/avatar.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true });
    if (uploadError) throw new Error(uploadError.message);

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(path);
    avatarUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;
  }

  const { error } = await supabase.from("profiles").upsert({
    user_id: user.id,
    first_name: firstName,
    last_name: lastName || null,
    phone: phone || null,
    persona,
    ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);

  revalidatePath("/inicio/perfil");
}
