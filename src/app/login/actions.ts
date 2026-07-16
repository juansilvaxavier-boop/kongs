"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";

export type AuthState = {
  error: string | null;
  info: string | null;
};

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") || "").trim(),
    password: String(formData.get("password") || ""),
  };
}

export async function signInWithPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Informe e-mail e senha.", info: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "E-mail ou senha inválidos.", info: null };
  }

  redirect(await resolveAuthenticatedDestination(supabase));
}

export async function signUpWithPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) {
    return { error: "Informe e-mail e senha.", info: null };
  }
  if (password.length < 6) {
    return { error: "A senha deve ter ao menos 6 caracteres.", info: null };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  });

  if (error) {
    return { error: error.message, info: null };
  }

  if (data.session) {
    redirect(await resolveAuthenticatedDestination(supabase));
  }

  return {
    error: null,
    info: "Cadastro criado! Verifique seu e-mail para confirmar a conta antes de entrar.",
  };
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${getSiteUrl()}/auth/callback` },
  });

  if (error || !data.url) {
    throw new Error(error?.message ?? "Não foi possível iniciar o login com o Google.");
  }

  redirect(data.url);
}

export async function signInWithMagicLink(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) {
    return { error: "Informe seu e-mail.", info: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${getSiteUrl()}/auth/callback` },
  });

  if (error) {
    return { error: error.message, info: null };
  }

  return {
    error: null,
    info: "Enviamos um link mágico de acesso para o seu e-mail.",
  };
}

export async function sendPasswordReset(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = String(formData.get("email") || "").trim();
  if (!email) {
    return { error: "Informe seu e-mail.", info: null };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/redefinir-senha`,
  });

  if (error) {
    return { error: error.message, info: null };
  }

  return {
    error: null,
    info: "Enviamos um link para redefinir sua senha por e-mail.",
  };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
