import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { naturalCompare } from "@/lib/datetime";
import { groupTeamsByFormat } from "@/lib/groups";
import { createGame } from "./actions";
import { GameDateField } from "./game-date-field";
import { GameTable } from "./game-table";
import { GenerateRoundsForm } from "./generate-rounds-form";
import { SumulaLinkSection } from "./sumula-link-section";
import { VenuesSection } from "./venues-section";

export default async function JogosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: championship },
    { data: gamesData },
    { data: teams },
    { data: players },
    { data: goalEvents },
    { data: cardEvents },
    { data: venues },
    { data: lineups },
    { data: signatures },
  ] =
    await Promise.all([
      supabase
        .from("championships")
        .select("has_knockout_stage, format")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("games")
        .select("id, round, team_a_id, team_b_id, date, score_a, score_b, played, venue_id")
        .eq("championship_id", id)
        .order("date", { ascending: true, nullsFirst: false }),
      supabase
        .from("teams")
        .select("id, name, group_name")
        .eq("championship_id", id)
        .order("name"),
      supabase
        .from("players")
        .select("id, name, team_id")
        .eq("championship_id", id),
      supabase
        .from("goal_events")
        .select("id, player_id, minute, game_id")
        .eq("championship_id", id),
      supabase
        .from("card_events")
        .select("id, player_id, card_type, minute, game_id")
        .eq("championship_id", id),
      supabase
        .from("venues")
        .select("id, name, address")
        .eq("championship_id", id)
        .order("name"),
      supabase
        .from("game_lineups")
        .select("game_id, player_id")
        .eq("championship_id", id),
      supabase
        .from("game_captain_signatures")
        .select("game_id, team_id, captain_name, signature_data_url, signed_at")
        .eq("championship_id", id),
    ]);

  const games = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : gamesData;

  const createGameWithId = createGame.bind(null, id);
  const hasEnoughTeams = (teams ?? []).length >= 2;
  const hasDrawnGames = (games ?? []).length > 0;
  const pools = groupTeamsByFormat(championship?.format ?? "liga", teams ?? []);
  const poolSizes = pools.map((pool) => pool.teams.length);

  return (
    <div>
      <PageHeader
        eyebrow="Tabela de jogos"
        title="Jogos"
        action={
          championship?.has_knockout_stage ? (
            <Link
              href={`/campeonato/${id}/chaveamento`}
              target="_blank"
              className="text-sm text-accent hover:underline"
            >
              Ver chaveamento →
            </Link>
          ) : undefined
        }
      />

      <SumulaLinkSection championshipId={id} />

      <VenuesSection championshipId={id} venues={venues ?? []} />

      {hasEnoughTeams && (
        <GenerateRoundsForm championshipId={id} poolSizes={poolSizes} />
      )}

      <Card className="mb-6 p-5">
        {hasEnoughTeams ? (
          <>
            <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-foreground">
              Ou agende um jogo manualmente
            </h2>
            {!hasDrawnGames && (
              <p className="mb-3 text-sm text-muted">
                A data só pode ser definida depois que o primeiro confronto
                existir — sorteie as rodadas acima, ou cadastre este jogo sem
                data e agende depois.
              </p>
            )}
            <ActionForm
              action={createGameWithId}
              className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
            >
              <div className="w-32">
                <Label>Rodada</Label>
                <Input name="round" required placeholder="Rodada 1" />
              </div>
              <div className="flex-1 basis-40">
                <Label>Time A</Label>
                <Select name="team_a_id" required defaultValue="">
                  <option value="" disabled>
                    Selecione
                  </option>
                  {(teams ?? []).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 basis-40">
                <Label>Time B</Label>
                <Select name="team_b_id" required defaultValue="">
                  <option value="" disabled>
                    Selecione
                  </option>
                  {(teams ?? []).map((team) => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex-1 basis-40">
                <Label>Data</Label>
                <GameDateField disabled={!hasDrawnGames} />
                {!hasDrawnGames && (
                  <p className="mt-1 text-xs text-muted">
                    Disponível após o sorteio dos confrontos.
                  </p>
                )}
              </div>
              {(venues ?? []).length > 0 && (
                <div className="flex-1 basis-40">
                  <Label>Local</Label>
                  <Select name="venue_id" defaultValue="">
                    <option value="">Sem local definido</option>
                    {(venues ?? []).map((venue) => (
                      <option key={venue.id} value={venue.id}>
                        {venue.name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              <SubmitButton pendingText="Agendando…">Agendar</SubmitButton>
            </ActionForm>
          </>
        ) : (
          <p className="text-sm text-muted">
            Cadastre ao menos dois times para poder agendar jogos.
          </p>
        )}
      </Card>

      {games && games.length > 0 ? (
        <GameTable
          championshipId={id}
          games={games}
          teams={teams ?? []}
          players={players ?? []}
          goalEvents={goalEvents ?? []}
          cardEvents={cardEvents ?? []}
          venues={venues ?? []}
          lineups={lineups ?? []}
          signatures={signatures ?? []}
        />
      ) : (
        <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
      )}
    </div>
  );
}
