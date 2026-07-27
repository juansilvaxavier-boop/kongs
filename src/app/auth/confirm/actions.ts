"use server";

import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { runAction, type ActionResult } from "@/lib/action-result";
import { resolveAuthenticatedDestination } from "@/lib/auth/destination";
import { safeNextPath } from "@/lib/auth/safe-next-path";

/**
 * Confirma o link de e-mail (recuperação de senha, cadastro, etc.) só
 * quando o usuário clica no botão desta tela — em vez de verificar
 * direto num GET automático (como o link padrão do Supabase faz), o que
 * deixa o token vulnerável a ser consumido por scanners de segurança de
 * e-mail que abrem os links antes do usuário (o token é de uso único).
 */
export async function confirmAuthLink(
  tokenHash: string,
  type: EmailOtpType,
  next: string | null
): Promise<ActionResult<{ redirectTo: string }>> {
  return runAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (error) throw new Error("Este link já foi usado ou expirou. Peça um novo.");

    if (type === "recovery") return { redirectTo: "/redefinir-senha" };

    const explicitNext = safeNextPath(next);
    const redirectTo = explicitNext ?? (await resolveAuthenticatedDestination(supabase));
    return { redirectTo };
  });
}
