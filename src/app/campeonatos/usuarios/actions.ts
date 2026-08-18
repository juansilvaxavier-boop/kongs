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

export async function createCustomRole(
  name: string,
  permissions: Permission[]
): Promise<ActionResult> {
  return runAction(async () => {
    if (!name.trim()) throw new Error("Informe um nome para o cargo.");
    if (permissions.length === 0) throw new Error("Selecione ao menos uma permissão.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("custom_roles")
      .insert({ name: name.trim(), permissions });
    if (error) throw new Error(error.message);
    revalidatePath("/campeonatos/usuarios");
  });
}

export async function deleteCustomRole(roleId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from("custom_roles").delete().eq("id", roleId);
    if (error) throw new Error(error.message);
    revalidatePath("/campeonatos/usuarios");
  });
}

export async function applyCustomRole(userId: string, roleId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_apply_custom_role", {
      p_user_id: userId,
      p_role_id: roleId,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/campeonatos/usuarios");
  });
}

export async function adminResetUserPassword(
  userId: string,
  newPassword: string
): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_reset_user_password", {
      p_user_id: userId,
      p_new_password: newPassword,
    });
    if (error) throw new Error(error.message);
  });
}

export async function adminConfirmUserEmail(userId: string): Promise<ActionResult> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.rpc("admin_confirm_user_email", {
      p_user_id: userId,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/campeonatos/usuarios");
  });
}
