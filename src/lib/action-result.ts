export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

const FALLBACK_MESSAGE = "Não foi possível concluir a ação. Tente novamente.";

/**
 * Server Actions que lançam exceções têm a mensagem de erro apagada pelo
 * Next.js em produção (substituída por um texto genérico em inglês sobre
 * "digest") — a mensagem real só sobrevive à travessia cliente/servidor se
 * for um valor de retorno normal, nunca um throw. Por isso toda action que
 * precisa mostrar um erro esperado ao usuário (validação, RLS, etc.) deve
 * envolver seu corpo aqui em vez de deixar o erro escapar como exceção.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : FALLBACK_MESSAGE };
  }
}
