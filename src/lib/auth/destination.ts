import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

async function hasAnyPermission(supabase: SupabaseClient<Database>): Promise<boolean> {
  const { data } = await supabase.from("user_permissions").select("permission").limit(1);
  return (data?.length ?? 0) > 0;
}

// Destino para quem escolheu (ou só tem acesso a) a experiência de
// usuário comum: dono de time cai direto no painel do time, o resto
// cai no hub padrão.
export async function resolveRegularDestination(
  supabase: SupabaseClient<Database>
): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/login";

  const { data: ownedTeam } = await supabase
    .from("teams")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  if (ownedTeam) return "/meu-time";

  return "/inicio";
}

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

  if (await hasAnyPermission(supabase)) {
    return "/entrar-como";
  }

  return resolveRegularDestination(supabase);
}
