import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const explicitNext = searchParams.get("next");

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const next = explicitNext ?? (await resolveAuthenticatedDestination(supabase));
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (tokenHash && type) {
    // Alguns links de e-mail do Supabase (ex.: recuperação de senha) usam o
    // formato token_hash/type em vez de code, dependendo do template
    // configurado no painel — tratamos os dois formatos aqui.
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      const next = explicitNext ?? (await resolveAuthenticatedDestination(supabase));
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
