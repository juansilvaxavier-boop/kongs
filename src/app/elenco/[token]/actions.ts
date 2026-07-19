"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { fileExtension, imageContentType, validateImageFile } from "@/lib/uploads";

function parsePhotoFile(formData: FormData): File | null {
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    validateImageFile(file);
    return file;
  }
  return null;
}

async function uploadPlayerPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  token: string,
  playerId: string,
  file: File
): Promise<string> {
  // O token faz parte do caminho para que a policy de storage
  // (roster_can_upload_player_photo) consiga exigir posse do token do
  // time, e não só o player_id (que é público) — ver migração
  // 20260719150000_security_hardening.sql.
  const path = `${token}/${playerId}/photo.${fileExtension(file)}`;
  const { error } = await supabase.storage.from("player-photos").upload(path, file, {
    upsert: true,
    contentType: imageContentType(file),
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("player-photos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

function parseNumber(formData: FormData): number {
  const value = String(formData.get("number") || "");
  if (!value) return null as unknown as number;
  const parsed = Number(value);
  return (Number.isFinite(parsed) ? parsed : null) as unknown as number;
}

function playerArgs(token: string, formData: FormData) {
  return {
    p_token: token,
    p_name: String(formData.get("name") || ""),
    p_document_type: String(formData.get("document_type") || ""),
    p_document_number: String(formData.get("document_number") || ""),
    p_position: String(formData.get("position") || ""),
    p_number: parseNumber(formData),
    p_birth_date: String(formData.get("birth_date") || ""),
  };
}

export async function rosterAddPlayer(token: string, formData: FormData) {
  const supabase = await createClient();
  const photoFile = parsePhotoFile(formData);

  const { data: playerId, error } = await supabase.rpc(
    "roster_add_player",
    playerArgs(token, formData)
  );
  if (error) throw new Error(error.message);

  if (photoFile && playerId) {
    const photoUrl = await uploadPlayerPhoto(supabase, token, playerId, photoFile);
    const { error: photoError } = await supabase.rpc("roster_set_player_photo", {
      p_token: token,
      p_player_id: playerId,
      p_photo_url: photoUrl,
    });
    if (photoError) throw new Error(photoError.message);
  }

  revalidatePath(`/elenco/${token}`);
}

export async function rosterUpdatePlayer(
  token: string,
  playerId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const photoFile = parsePhotoFile(formData);

  const { error } = await supabase.rpc("roster_update_player", {
    ...playerArgs(token, formData),
    p_player_id: playerId,
  });
  if (error) throw new Error(error.message);

  if (photoFile) {
    const photoUrl = await uploadPlayerPhoto(supabase, token, playerId, photoFile);
    const { error: photoError } = await supabase.rpc("roster_set_player_photo", {
      p_token: token,
      p_player_id: playerId,
      p_photo_url: photoUrl,
    });
    if (photoError) throw new Error(photoError.message);
  }

  revalidatePath(`/elenco/${token}`);
}

export async function rosterDeletePlayer(token: string, playerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("roster_delete_player", {
    p_token: token,
    p_player_id: playerId,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/elenco/${token}`);
}

export async function rosterSetCoach(token: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("roster_set_coach", {
    p_token: token,
    p_coach_name: String(formData.get("coach_name") || ""),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/elenco/${token}`);
}

export async function rosterSubmit(token: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("roster_submit", { p_token: token });
  if (error) throw new Error(error.message);
  revalidatePath(`/elenco/${token}`);
}
