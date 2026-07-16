import { createClient } from "@/lib/supabase/server";
import { Button, Card, EmptyState, Input, Label, PageHeader, Select } from "@/components/ui";
import { naturalCompare } from "@/lib/datetime";
import { createGame } from "./actions";
import { GameDateField } from "./game-date-field";
import { GameTable } from "./game-table";
import { GenerateRoundsForm } from "./generate-rounds-form";

export default async function JogosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: gamesData }, { data: teams }, { data: players }, { data: goalEvents }, { data: cardEvents }] =
    await Promise.all([
      supabase
        .from("games")
        .select("id, round, team_a_id, team_b_id, date, score_a, score_b, played")
        .eq("championship_id", id)
        .order("date", { ascending: true, nullsFirst: false }),
      supabase
        .from("teams")
        .select("id, name")
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
    ]);

  const games = gamesData
    ? [...gamesData].sort((a, b) => naturalCompare(a.round, b.round))
    : gamesData;

  const createGameWithId = createGame.bind(null, id);
  const hasEnoughTeams = (teams ?? []).length >= 2;

  return (
    <div>
      <PageHeader eyebrow="Tabela de jogos" title="Jogos" />

      <Card className="mb-6 p-5">
        {hasEnoughTeams ? (
          <form
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
              <GameDateField />
            </div>
            <Button type="submit">Agendar</Button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            Cadastre ao menos dois times para poder agendar jogos.
          </p>
        )}
      </Card>

      {hasEnoughTeams && (
        <GenerateRoundsForm championshipId={id} teamCount={(teams ?? []).length} />
      )}

      {games && games.length > 0 ? (
        <GameTable
          championshipId={id}
          games={games}
          teams={teams ?? []}
          players={players ?? []}
          goalEvents={goalEvents ?? []}
          cardEvents={cardEvents ?? []}
        />
      ) : (
        <EmptyState>Nenhum jogo agendado ainda.</EmptyState>
      )}
    </div>
  );
}
