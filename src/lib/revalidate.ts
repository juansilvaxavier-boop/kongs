import { revalidatePath } from "next/cache";

export function revalidateChampionship(championshipId: string) {
  revalidatePath(`/campeonatos/${championshipId}`, "layout");
  revalidatePath(`/racha/${championshipId}/gerenciar`, "layout");
}
