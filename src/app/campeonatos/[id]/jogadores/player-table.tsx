"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { PLAYER_POSITIONS } from "@/lib/positions";
import { deletePlayer, updatePlayer } from "./actions";

type Team = { id: string; name: string };
type Player = {
  id: string;
  name: string;
  team_id: string | null;
  number: number | null;
  position: string | null;
};

export function PlayerTable({
  championshipId,
  players,
  teams,
}: {
  championshipId: string;
  players: Player[];
  teams: Team[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const teamName = (teamId: string | null) =>
    teams.find((t) => t.id === teamId)?.name ?? "Sem time";

  if (players.length === 0) {
    return <EmptyState>Nenhum jogador cadastrado ainda.</EmptyState>;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Jogador</th>
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Nº</th>
            <th className="px-4 py-3">Posição</th>
            <th className="w-40 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id} className="border-b border-border last:border-0">
              {editingId === player.id ? (
                <td colSpan={5} className="px-4 py-3">
                  <form
                    action={async (formData) => {
                      await updatePlayer(player.id, championshipId, formData);
                      setEditingId(null);
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Input
                      name="name"
                      defaultValue={player.name}
                      autoFocus
                      required
                      className="max-w-[10rem]"
                    />
                    <Select
                      name="team_id"
                      defaultValue={player.team_id ?? ""}
                      className="max-w-[10rem]"
                    >
                      <option value="">Sem time</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </Select>
                    <Input
                      name="number"
                      type="number"
                      defaultValue={player.number ?? ""}
                      placeholder="Nº"
                      className="max-w-[5rem]"
                    />
                    <Select
                      name="position"
                      defaultValue={player.position ?? ""}
                      className="max-w-[9rem]"
                    >
                      <option value="">Posição</option>
                      {PLAYER_POSITIONS.map((position) => (
                        <option key={position} value={position}>
                          {position}
                        </option>
                      ))}
                    </Select>
                    <Button type="submit">Salvar</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setEditingId(null)}
                    >
                      Cancelar
                    </Button>
                  </form>
                </td>
              ) : (
                <>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {player.name}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {teamName(player.team_id)}
                  </td>
                  <td className="px-4 py-3 text-muted">{player.number ?? "—"}</td>
                  <td className="px-4 py-3">
                    {player.position ? (
                      <Badge>{player.position}</Badge>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(player.id)}
                      >
                        Editar
                      </Button>
                      <form
                        action={async () => {
                          if (
                            window.confirm(`Excluir o jogador "${player.name}"?`)
                          ) {
                            await deletePlayer(player.id, championshipId);
                          }
                        }}
                      >
                        <Button type="submit" variant="danger">
                          Excluir
                        </Button>
                      </form>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
