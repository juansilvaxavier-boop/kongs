import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type Permission =
  | "manage_championships"
  | "manage_teams_games"
  | "manage_finance"
  | "manage_sponsors";

export const PERMISSION_LABELS: Record<Permission, string> = {
  manage_championships: "Campeonatos",
  manage_teams_games: "Times, jogos e árbitros",
  manage_finance: "Financeiro",
  manage_sponsors: "Patrocinadores",
};

export async function isAdmin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
}

export async function getUserPermissions(
  supabase: SupabaseClient<Database>
): Promise<Permission[]> {
  const { data } = await supabase.from("user_permissions").select("permission");
  return (data ?? []).map((row) => row.permission as Permission);
}

export type AccessContext = {
  isAdmin: boolean;
  permissions: Permission[];
  canManage: boolean;
};

// Admin ou permissão granular concedida — o par usado em todo lugar
// que decide se alguém pode entrar no painel de gestão (/campeonatos)
// ou ver o botão de troca de perfil.
export async function getAccessContext(
  supabase: SupabaseClient<Database>
): Promise<AccessContext> {
  const admin = await isAdmin(supabase);
  const permissions = admin ? [] : await getUserPermissions(supabase);
  return { isAdmin: admin, permissions, canManage: admin || permissions.length > 0 };
}

export async function getOwnedTeam(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data } = await supabase
    .from("teams")
    .select("id, championship_id, name")
    .eq("owner_user_id", userId)
    .maybeSingle();

  return data;
}
