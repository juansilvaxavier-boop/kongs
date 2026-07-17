import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function resolveAuthenticatedDestination(
  supabase: SupabaseClient<Database>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  const { data: invites } = await supabase
    .from("team_invites")
    .select("id")
    .is("accepted_at", null)
    .limit(1);

  if (invites && invites.length > 0) {
    await supabase.rpc("accept_team_invite", { p_invite_id: invites[0].id });
  }

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (roleRow?.role === "admin") return "/campeonatos";

  const { data: ownedTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (ownedTeam) return "/meu-time";

  return "/meu-perfil";
}
