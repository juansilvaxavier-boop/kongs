"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  const { error } = await supabase.rpc("roster_add_player", playerArgs(token, formData));
  if (error) throw new Error(error.message);
  revalidatePath(`/elenco/${token}`);
}

export async function rosterUpdatePlayer(
  token: string,
  playerId: string,
  formData: FormData
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("roster_update_player", {
    ...playerArgs(token, formData),
    p_player_id: playerId,
  });
  if (error) throw new Error(error.message);
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
