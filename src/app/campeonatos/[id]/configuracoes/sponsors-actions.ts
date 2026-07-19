"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { fileExtension, imageContentType, validateImageFile } from "@/lib/uploads";

function parseLogoFile(formData: FormData): File | null {
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) {
    validateImageFile(file);
    return file;
  }
  return null;
}

function parseLinkUrl(formData: FormData): string | null {
  const value = String(formData.get("link_url") || "").trim();
  return value ? value : null;
}

async function uploadSponsorLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sponsorId: string,
  file: File
): Promise<string> {
  const path = `${sponsorId}/logo.${fileExtension(file)}`;
  const { error } = await supabase.storage.from("sponsor-logos").upload(path, file, {
    upsert: true,
    contentType: imageContentType(file),
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("sponsor-logos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function createSponsor(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do patrocinador.");
  const logoFile = parseLogoFile(formData);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sponsors")
    .insert({
      championship_id: championshipId,
      name,
      link_url: parseLinkUrl(formData),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (logoFile) {
    const logoUrl = await uploadSponsorLogo(supabase, data.id, logoFile);
    const { error: logoError } = await supabase
      .from("sponsors")
      .update({ logo_url: logoUrl })
      .eq("id", data.id);
    if (logoError) throw new Error(logoError.message);
  }

  revalidateChampionship(championshipId);
}

export async function updateSponsor(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do patrocinador.");
  const logoFile = parseLogoFile(formData);

  const supabase = await createClient();
  const logoUrl = logoFile ? await uploadSponsorLogo(supabase, id, logoFile) : undefined;

  const { data, error } = await supabase
    .from("sponsors")
    .update({
      name,
      link_url: parseLinkUrl(formData),
      ...(logoUrl ? { logo_url: logoUrl } : {}),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Patrocinador não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deleteSponsor(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sponsors").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}
