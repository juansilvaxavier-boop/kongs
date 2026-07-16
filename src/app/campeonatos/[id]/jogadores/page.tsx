import { createClient } from "@/lib/supabase/server";
import { Button, Card, Input, Label, PageHeader, Select } from "@/components/ui";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { createPlayer } from "./actions";
import { PlayerTable } from "./player-table";

export default async function JogadoresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: players }, { data: teams }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, team_id, number, position")
      .eq("championship_id", id)
      .order("name"),
    supabase
      .from("teams")
      .select("id, name")
      .eq("championship_id", id)
      .order("name"),
  ]);

  const createPlayerWithId = createPlayer.bind(null, id);

  return (
    <div>
      <PageHeader eyebrow="Elenco de atletas" title="Jogadores" />

      <Card className="mb-6 p-5">
        <form
          action={createPlayerWithId}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex-1 basis-40">
            <Label>Nome</Label>
            <Input name="name" required placeholder="Nome do jogador" />
          </div>
          <div className="flex-1 basis-40">
            <Label>Time</Label>
            <Select name="team_id" defaultValue="">
              <option value="">Sem time</option>
              {(teams ?? []).map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-24">
            <Label>Número</Label>
            <Input name="number" type="number" placeholder="Nº" />
          </div>
          <div className="flex-1 basis-40">
            <Label>Posição</Label>
            <Select name="position" defaultValue="">
              <option value="">Posição</option>
              {PLAYER_POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Adicionar</Button>
        </form>
      </Card>

      <PlayerTable
        championshipId={id}
        players={players ?? []}
        teams={teams ?? []}
      />
    </div>
  );
}
