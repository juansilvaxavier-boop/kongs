export function parsePositiveIntOrNull(
  formData: FormData,
  field: string,
  label: string
): number | null {
  const raw = String(formData.get(field) || "").trim();
  if (!raw) return null;

  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Informe um número válido para "${label}" (maior que zero).`);
  }
  return Math.trunc(value);
}
