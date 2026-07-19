export function localInputToIso(local: string): string {
  if (!local) return "";
  const [datePart, timePart] = local.split("T");
  if (!datePart || !timePart) return "";
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  if ([year, month, day, hour, minute].some((n) => Number.isNaN(n))) return "";
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

export function isBirthdayToday(birthDate: string | null, today: Date = new Date()): boolean {
  if (!birthDate) return false;
  const [, month, day] = birthDate.split("-").map(Number);
  return month === today.getMonth() + 1 && day === today.getDate();
}

export function naturalCompare(a: string, b: string): number {
  const chunks = (s: string) => s.match(/\d+|\D+/g) ?? [];
  const chunksA = chunks(a);
  const chunksB = chunks(b);
  const len = Math.max(chunksA.length, chunksB.length);

  for (let i = 0; i < len; i++) {
    const partA = chunksA[i] ?? "";
    const partB = chunksB[i] ?? "";
    const numA = Number(partA);
    const numB = Number(partB);
    const bothNumeric = partA !== "" && partB !== "" && !Number.isNaN(numA) && !Number.isNaN(numB);

    if (bothNumeric) {
      if (numA !== numB) return numA - numB;
    } else if (partA !== partB) {
      return partA.localeCompare(partB, "pt-BR");
    }
  }
  return 0;
}
