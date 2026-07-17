"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { getSiteUrl } from "@/lib/site-url";
import { fileExtension, validateImageFile } from "@/lib/uploads";

function parseCoachId(formData: FormData) {
  const value = String(formData.get("coach_id") || "");
  return value ? value : null;
}

function parseCrestFile(formData: FormData): File | null {
  const file = formData.get("crest");
  if (file instanceof File && file.size > 0) {
    validateImageFile(file);
    return file;
  }
  return null;
}

function parseGroupName(formData: FormData) {
  const value = String(formData.get("group_name") || "").trim();
  return value ? value : null;
}

async function uploadCrest(
  supabase: Awaited<ReturnType<typeof createClient>>,
  teamId: string,
  file: File
): Promise<string> {
  const path = `${teamId}/crest.${fileExtension(file)}`;
  const { error } = await supabase.storage.from("crests").upload(path, file, {
    upsert: true,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("crests").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

async function assertCoachBelongsToChampionship(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  coachId: string | null
) {
  if (!coachId) return;

  const { data, error } = await supabase
    .from("coaches")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("id", coachId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("O técnico selecionado não pertence a este campeonato.");
}

export async function createTeam(championshipId: string, formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do time.");

  const coachId = parseCoachId(formData);
  const crestFile = parseCrestFile(formData);
  const supabase = await createClient();
  await assertCoachBelongsToChampionship(supabase, championshipId, coachId);

  const { data, error } = await supabase
    .from("teams")
    .insert({
      championship_id: championshipId,
      name,
      coach_id: coachId,
      group_name: parseGroupName(formData),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  if (crestFile) {
    const crestUrl = await uploadCrest(supabase, data.id, crestFile);
    const { error: crestError } = await supabase
      .from("teams")
      .update({ crest_url: crestUrl })
      .eq("id", data.id);
    if (crestError) throw new Error(crestError.message);
  }

  revalidateChampionship(championshipId);
}

export async function updateTeam(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do time.");

  const coachId = parseCoachId(formData);
  const crestFile = parseCrestFile(formData);
  const supabase = await createClient();
  await assertCoachBelongsToChampionship(supabase, championshipId, coachId);

  const crestUrl = crestFile ? await uploadCrest(supabase, id, crestFile) : undefined;

  const { data, error } = await supabase
    .from("teams")
    .update({
      name,
      coach_id: coachId,
      group_name: parseGroupName(formData),
      ...(crestUrl ? { crest_url: crestUrl } : {}),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Time não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deleteTeam(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("teams").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function inviteTeamOwner(
  championshipId: string,
  teamId: string,
  formData: FormData
) {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  if (!email) throw new Error("Informe o e-mail do dono do time.");

  const supabase = await createClient();

  const { error: insertError } = await supabase.from("team_invites").insert({
    championship_id: championshipId,
    team_id: teamId,
    email,
  });
  if (insertError) throw new Error(insertError.message);

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  });
  if (otpError) throw new Error(otpError.message);

  revalidateChampionship(championshipId);
}

export async function cancelTeamInvite(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("team_invites").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function resendTeamInvite(id: string, championshipId: string) {
  const supabase = await createClient();

  const { data: invite, error: fetchError } = await supabase
    .from("team_invites")
    .select("email")
    .eq("id", id)
    .is("accepted_at", null)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!invite) throw new Error("Convite não encontrado ou já aceito.");

  const { error: otpError } = await supabase.auth.signInWithOtp({
    email: invite.email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  });
  if (otpError) throw new Error(otpError.message);

  revalidateChampionship(championshipId);
}

// Jogadores e técnicos são cadastrados dentro do fluxo do time (elenco
// expansível na aba Times), não em telas separadas.

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

export async function createPlayer(
  championshipId: string,
  teamId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do jogador.");

  const supabase = await createClient();
  const { error } = await supabase.from("players").insert({
    championship_id: championshipId,
    name,
    team_id: teamId,
    number: parseNumber(formData),
    position: parsePosition(formData),
  });

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function updatePlayer(
  id: string,
  championshipId: string,
  formData: FormData
) {
  const name = String(formData.get("name") || "").trim();
  if (!name) throw new Error("Informe o nome do jogador.");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("players")
    .update({
      name,
      number: parseNumber(formData),
      position: parsePosition(formData),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Jogador não encontrado ou sem permissão para editar.");
  revalidateChampionship(championshipId);
}

export async function deletePlayer(id: string, championshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("players").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateChampionship(championshipId);
}

export async function setOrCreateTeamCoach(
  teamId: string,
  championshipId: string,
  formData: FormData
) {
  const newCoachName = String(formData.get("new_coach_name") || "").trim();
  const existingCoachId = String(formData.get("coach_id") || "");

  const supabase = await createClient();
  let coachId: string | null = existingCoachId || null;

  if (newCoachName) {
    const { data, error } = await supabase
      .from("coaches")
      .insert({ championship_id: championshipId, name: newCoachName })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    coachId = data.id;
  }

  const { error } = await supabase
    .from("teams")
    .update({ coach_id: coachId })
    .eq("id", teamId);
  if (error) throw new Error(error.message);

  revalidateChampionship(championshipId);
}
