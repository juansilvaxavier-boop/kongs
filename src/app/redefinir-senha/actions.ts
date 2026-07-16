"use server";

import { createClient } from "@/lib/supabase/server";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";
import { redirect } from "next/navigation";

export type UpdatePasswordState = {
  error: string | null;
};

export async function updatePassword(
  _prevState: UpdatePasswordState,
  formData: FormData
): Promise<UpdatePasswordState> {
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres." };
  }
  if (password !== confirmPassword) {
    return { error: "As senhas não coincidem." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  redirect(await resolveAuthenticatedDestination(supabase));
}
