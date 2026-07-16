import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export async function isAdmin(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase.rpc("is_admin");
  if (error) return false;
  return data === true;
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
