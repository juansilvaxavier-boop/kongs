"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fileExtension, imageContentType, validateImageFile } from "@/lib/uploads";
import { runAction, type ActionResult } from "@/lib/action-result";

const PERSONAS = ["jogador", "treinador", "torcedor"] as const;

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
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
      validateImageFile(avatarFile);
      const path = `${user.id}/avatar.${fileExtension(avatarFile)}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, avatarFile, { upsert: true, contentType: imageContentType(avatarFile) });
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
  });
}
