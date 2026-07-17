import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Badge, BrandMark, Card, EmptyState, PageHeader } from "@/components/ui";

export default async function SumulaGamePickerPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const [{ data: championshipRows, error: championshipError }, { data: games, error: gamesError }] =
    await Promise.all([
      supabase.rpc("sumula_get_championship", { p_token: token }),
      supabase.rpc("sumula_list_games", { p_token: token }),
    ]);

  if (championshipError || !championshipRows || championshipRows.length === 0) notFound();
  const championship = championshipRows[0];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-muted">
          {championship.championship_name}
        </span>
      </div>
      <PageHeader eyebrow="Súmula digital" title="Escolha o jogo" />

      {gamesError || !games || games.length === 0 ? (
        <EmptyState>Nenhum jogo cadastrado neste campeonato ainda.</EmptyState>
      ) : (
        <div className="space-y-2">
          {games.map((game) => (
            <Link key={game.game_id} href={`/sumula/${token}/${game.game_id}`}>
              <Card className="flex items-center justify-between p-4 transition hover:border-accent/60">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">{game.round}</p>
                  <p className="font-display font-bold text-foreground">
                    {game.team_a_name} x {game.team_b_name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display text-lg font-bold text-foreground">
                    {game.played ? `${game.score_a} - ${game.score_b}` : "—"}
                  </span>
                  <Badge tone={game.played ? "success" : "warning"}>
                    {game.played ? "Realizado" : "Agendado"}
                  </Badge>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
