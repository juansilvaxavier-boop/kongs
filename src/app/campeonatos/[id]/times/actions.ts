"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidateChampionship } from "@/lib/revalidate";
import { getSiteUrl } from "@/lib/site-url";
import { fileExtension, imageContentType, validateImageFile } from "@/lib/uploads";
import { runAction, type ActionResult } from "@/lib/action-result";

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
    contentType: imageContentType(file),
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

export async function createTeam(championshipId: string, formData: FormData): Promise<ActionResult> {
  return runAction(async () => {
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
  });
}

export async function updateTeam(
  id: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
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
  });
}

export async function deleteTeam(id: string, championshipId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("teams").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function getTeamRosterLink(teamId: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_or_create_team_roster_token", {
      p_team_id: teamId,
    });
    if (error) throw new Error(error.message);
    return `${getSiteUrl()}/elenco/${data}`;
  });
}

export async function regenerateTeamRosterLink(teamId: string): Promise<ActionResult<string>> {
  return runAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("regenerate_team_roster_token", {
      p_team_id: teamId,
    });
    if (error) throw new Error(error.message);
    return `${getSiteUrl()}/elenco/${data}`;
  });
}

export type TeamRosterStatus = { playerCount: number; submitted: boolean };

export async function getTeamRosterStatus(teamId: string): Promise<ActionResult<TeamRosterStatus>> {
  return runAction(async () => {
    const linkResult = await getTeamRosterLink(teamId);
    if (!linkResult.ok) throw new Error(linkResult.error);
    const token = linkResult.data.split("/").pop()!;
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("roster_get_team", { p_token: token });
    if (error) throw new Error(error.message);
    const row = data?.[0];
    return {
      playerCount: row?.player_count ?? 0,
      submitted: Boolean(row?.submitted_at),
    };
  });
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

function parseBirthDate(formData: FormData): string {
  const value = String(formData.get("birth_date") || "").trim();
  if (!value) throw new Error("Informe a data de nascimento do jogador.");
  return value;
}

function parseDocument(formData: FormData) {
  const type = String(formData.get("document_type") || "").trim();
  const rawNumber = String(formData.get("document_number") || "").trim();

  if (!type && !rawNumber) {
    return { document_type: null as string | null, document_number: null as string | null };
  }
  if (type !== "cpf" && type !== "rg") {
    throw new Error("Selecione o tipo de documento (CPF ou RG).");
  }
  if (!rawNumber) {
    throw new Error("Informe o número do documento.");
  }
  if (type === "cpf") {
    const digits = rawNumber.replace(/\D/g, "");
    if (digits.length !== 11) {
      throw new Error("CPF precisa ter 11 dígitos.");
    }
    return { document_type: type, document_number: digits };
  }
  return { document_type: type, document_number: rawNumber };
}

function parsePhotoFile(formData: FormData): File | null {
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    validateImageFile(file);
    return file;
  }
  return null;
}

async function assertCpfNotDuplicated(
  supabase: Awaited<ReturnType<typeof createClient>>,
  championshipId: string,
  documentType: string | null,
  documentNumber: string | null,
  excludePlayerId?: string
) {
  if (documentType !== "cpf" || !documentNumber) return;

  let query = supabase
    .from("players")
    .select("id")
    .eq("championship_id", championshipId)
    .eq("document_type", "cpf")
    .eq("document_number", documentNumber);
  if (excludePlayerId) query = query.neq("id", excludePlayerId);

  const { data, error } = await query.limit(1);
  if (error) throw new Error(error.message);
  if (data && data.length > 0) {
    throw new Error("Já existe um jogador cadastrado com este CPF neste campeonato.");
  }
}

async function uploadPlayerPhoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  playerId: string,
  file: File
): Promise<string> {
  const path = `${playerId}/photo.${fileExtension(file)}`;
  const { error } = await supabase.storage.from("player-photos").upload(path, file, {
    upsert: true,
    contentType: imageContentType(file),
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from("player-photos").getPublicUrl(path);
  return `${data.publicUrl}?v=${Date.now()}`;
}

export async function createPlayer(
  championshipId: string,
  teamId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do jogador.");

    const photoFile = parsePhotoFile(formData);
    const document = parseDocument(formData);
    const birthDate = parseBirthDate(formData);
    const supabase = await createClient();
    await assertCpfNotDuplicated(
      supabase,
      championshipId,
      document.document_type,
      document.document_number
    );
    const { data, error } = await supabase
      .from("players")
      .insert({
        championship_id: championshipId,
        name,
        team_id: teamId,
        number: parseNumber(formData),
        position: parsePosition(formData),
        document_type: document.document_type,
        document_number: document.document_number,
        birth_date: birthDate,
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    if (photoFile) {
      const photoUrl = await uploadPlayerPhoto(supabase, data.id, photoFile);
      const { error: photoError } = await supabase
        .from("players")
        .update({ photo_url: photoUrl })
        .eq("id", data.id);
      if (photoError) throw new Error(photoError.message);
    }

    revalidateChampionship(championshipId);
  });
}

export async function updatePlayer(
  id: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
    const name = String(formData.get("name") || "").trim();
    if (!name) throw new Error("Informe o nome do jogador.");

    const photoFile = parsePhotoFile(formData);
    const document = parseDocument(formData);
    const birthDate = parseBirthDate(formData);
    const supabase = await createClient();
    await assertCpfNotDuplicated(
      supabase,
      championshipId,
      document.document_type,
      document.document_number,
      id
    );
    const photoUrl = photoFile ? await uploadPlayerPhoto(supabase, id, photoFile) : undefined;

    const { data, error } = await supabase
      .from("players")
      .update({
        name,
        number: parseNumber(formData),
        position: parsePosition(formData),
        document_type: document.document_type,
        document_number: document.document_number,
        birth_date: birthDate,
        ...(photoUrl ? { photo_url: photoUrl } : {}),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw new Error("Jogador não encontrado ou sem permissão para editar.");
    revalidateChampionship(championshipId);
  });
}

export async function deletePlayer(id: string, championshipId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("players").delete().eq("id", id);

    if (error) throw new Error(error.message);
    revalidateChampionship(championshipId);
  });
}

export async function setOrCreateTeamCoach(
  teamId: string,
  championshipId: string,
  formData: FormData
): Promise<ActionResult> {
  return runAction(async () => {
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
  });
}
