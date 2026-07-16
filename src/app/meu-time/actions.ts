"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getOwnedTeam } from "@/lib/auth/roles";

async function requireOwnedTeam() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sessão expirada. Faça login novamente.");

  const team = await getOwnedTeam(supabase, user.id);
  if (!team) throw new Error("Você não está vinculado a nenhum time.");

  return { supabase, team };
}

function parseNumber(formData: FormData) {
  const value = String(formData.get("number") || "");
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parsePosition(formData: FormData) {
  const value = String(formData.get("position") || "").trim();
  return value ? value : null;
}

export async function updateOwnTeam(formData: FormData) {
  const { supabase, team } = await requireOwnedTeam();

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do time.");

  const crestUrl = String(formData.get("crest_url") || "").trim();
  const coachId = String(formData.get("coach_id") || "");

  if (coachId) {
    const { data: coach, error: coachError } = await supabase
      .from("coaches")
      .select("id")
      .eq("championship_id", team.championship_id)
      .eq("id", coachId)
      .maybeSingle();
    if (coachError) throw new Error(coachError.message);
    if (!coach) throw new Error("O técnico selecionado não pertence a este campeonato.");
  }

  const { error } = await supabase
    .from("teams")
    .update({
      name,
      crest_url: crestUrl ? crestUrl : null,
      coach_id: coachId ? coachId : null,
    })
    .eq("id", team.id);

  if (error) throw new Error(error.message);
  revalidatePath("/meu-time");
}

export async function createOwnPlayer(formData: FormData) {
  const { supabase, team } = await requireOwnedTeam();

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do jogador.");

  const { error } = await supabase.from("players").insert({
    championship_id: team.championship_id,
    team_id: team.id,
    name,
    number: parseNumber(formData),
    position: parsePosition(formData),
  });

  if (error) throw new Error(error.message);
  revalidatePath("/meu-time");
}

export async function updateOwnPlayer(id: string, formData: FormData) {
  const { supabase, team } = await requireOwnedTeam();

  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do jogador.");

  const { data, error } = await supabase
    .from("players")
    .update({
      name,
      number: parseNumber(formData),
      position: parsePosition(formData),
    })
    .eq("id", id)
    .eq("team_id", team.id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Jogador não encontrado no seu elenco.");
  revalidatePath("/meu-time");
}

export async function deleteOwnPlayer(id: string) {
  const { supabase, team } = await requireOwnedTeam();

  const { error } = await supabase
    .from("players")
    .delete()
    .eq("id", id)
    .eq("team_id", team.id);

  if (error) throw new Error(error.message);
  revalidatePath("/meu-time");
}
