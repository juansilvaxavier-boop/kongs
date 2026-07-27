import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";
import { safeNextPath } from "@/lib/auth/safe-next-path";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const explicitNext = safeNextPath(searchParams.get("next"));

  const supabase = await createClient();

  // Link de recuperação de senha: sempre manda para a tela de nova senha,
  // mesmo que o `next` não tenha vindo (ou tenha sido descartado) — nunca
  // deixa a recuperação cair no destino padrão de usuário logado.
  const recoveryNext = type === "recovery" ? "/redefinir-senha" : null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = recoveryNext ?? explicitNext ?? (await resolveAuthenticatedDestination(supabase));
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (tokenHash && type) {
    // Alguns links de e-mail do Supabase (ex.: recuperação de senha) usam o
    // formato token_hash/type em vez de code, dependendo do template
    // configurado no painel — tratamos os dois formatos aqui.
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const next = recoveryNext ?? explicitNext ?? (await resolveAuthenticatedDestination(supabase));
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
