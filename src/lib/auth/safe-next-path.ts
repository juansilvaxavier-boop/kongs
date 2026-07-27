// Só aceita um caminho relativo dentro do próprio app — bloqueia truques de
// host confusion como "next=@evil.com/x" ou "next=//evil.com" que,
// concatenados com `origin`, fariam o navegador redirecionar para um
// domínio externo.
export function safeNextPath(next: string | null): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("@")) {
    return null;
  }
  return next;
}
