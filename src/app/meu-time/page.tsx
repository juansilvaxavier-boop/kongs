import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOwnedTeam } from "@/lib/auth/roles";
import {
  Button,
  Card,
  Input,
  Label,
  PageHeader,
  Select,
} from "@/components/ui";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { createOwnPlayer, updateOwnTeam } from "./actions";
import { OwnPlayerTable } from "./own-player-table";

export default async function MeuTimePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const team = await getOwnedTeam(supabase, user.id);
  if (!team) redirect("/sem-acesso");

  const [{ data: fullTeam }, { data: coaches }, { data: players }] =
    await Promise.all([
      supabase
        .from("teams")
        .select("id, name, crest_url, coach_id")
        .eq("id", team.id)
        .single(),
      supabase
        .from("coaches")
        .select("id, name")
        .eq("championship_id", team.championship_id)
        .order("name"),
      supabase
        .from("players")
        .select("id, name, number, position")
        .eq("team_id", team.id)
        .order("name"),
    ]);

  return (
    <div className="space-y-8">
      <div>
        <PageHeader eyebrow="Área do dono do time" title="Meu time" />
        <div className="-mt-4 mb-6 flex flex-wrap gap-3 text-sm">
          <Link
            href={`/campeonato/${team.championship_id}`}
            className="text-accent underline"
          >
            Ver classificação e jogos do campeonato →
          </Link>
        </div>
      </div>

      <Card className="p-5">
        <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Dados do time
        </h2>
        <form
          action={updateOwnTeam}
          className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
        >
          <div className="flex-1 basis-40">
            <Label>Nome do time</Label>
            <Input name="name" required defaultValue={fullTeam?.name ?? ""} />
          </div>
          <div className="flex-1 basis-40">
            <Label>Técnico</Label>
            <Select name="coach_id" defaultValue={fullTeam?.coach_id ?? ""}>
              <option value="">Sem técnico</option>
              {(coaches ?? []).map((coach) => (
                <option key={coach.id} value={coach.id}>
                  {coach.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex-1 basis-40">
            <Label>Escudo (URL)</Label>
            <Input
              name="crest_url"
              type="url"
              placeholder="https://..."
              defaultValue={fullTeam?.crest_url ?? ""}
            />
          </div>
          <Button type="submit">Salvar</Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-4 font-display text-lg font-bold uppercase tracking-wide text-foreground">
          Elenco
        </h2>

        <Card className="mb-6 p-5">
          <form
            action={createOwnPlayer}
            className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="flex-1 basis-40">
              <Label>Nome</Label>
              <Input name="name" required placeholder="Nome do jogador" />
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

        <OwnPlayerTable players={players ?? []} />
      </div>
    </div>
  );
}
