import { redirect } from "next/navigation";

export default async function PublicChampionshipIndexPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/campeonato/${id}/visao-geral`);
}
