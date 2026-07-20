"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/auth/roles";

export async function setUserAdmin(userId: string, granted: boolean): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_user_admin", {
      p_user_id: userId,
      p_is_admin: granted,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/campeonatos/usuarios");
  });
}

export async function setUserPermission(
  userId: string,
  permission: Permission,
  granted: boolean
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_set_user_permission", {
      p_user_id: userId,
      p_permission: permission,
      p_granted: granted,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/campeonatos/usuarios");
  });
}
