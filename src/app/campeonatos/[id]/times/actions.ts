"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { getSiteUrl } from "@/lib/site-url";

function parseCoachId(formData: FormData) {
  const value = String(formData.get("coach_id") || "");
  return value ? value : null;
}

function parseCrestUrl(formData: FormData) {
  const value = String(formData.get("crest_url") || "").trim();
  return value ? value : null;
}

function parseGroupName(formData: FormData) {
  const value = String(formData.get("group_name") || "").trim();
  return value ? value : null;
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
  const supabase = await createClient();
  await assertCoachBelongsToChampionship(supabase, championshipId, coachId);

  const { error } = await supabase.from("teams").insert({
    championship_id: championshipId,
    name,
    coach_id: coachId,
    crest_url: parseCrestUrl(formData),
    group_name: parseGroupName(formData),
  });

  if (error) throw new Error(error.message);
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
  const supabase = await createClient();
  await assertCoachBelongsToChampionship(supabase, championshipId, coachId);

  const { data, error } = await supabase
    .from("teams")
    .update({
      name,
      coach_id: coachId,
      crest_url: parseCrestUrl(formData),
      group_name: parseGroupName(formData),
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
