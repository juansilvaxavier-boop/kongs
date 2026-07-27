/** Só conta os dígitos — mesma regra usada em roster_validate_player no
 * banco (11 dígitos, sem checksum), pra validar no cliente antes de
 * enviar. */
export function isValidCpf(value: string): boolean {
  return onlyDigits(value).length === 11;
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function formatCpf(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean);
  let formatted = parts.join(".");
  if (digits.length > 9) formatted += `-${digits.slice(9, 11)}`;
  return formatted;
}
