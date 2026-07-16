"use client";

import { useState } from "react";
import { Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { deleteTeam, updateTeam } from "./actions";

type Coach = { id: string; name: string };
type Team = { id: string; name: string; coach_id: string | null };

export function TeamTable({
  championshipId,
  teams,
  coaches,
}: {
  championshipId: string;
  teams: Team[];
  coaches: Coach[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const coachName = (coachId: string | null) =>
    coaches.find((c) => c.id === coachId)?.name ?? "—";

  if (teams.length === 0) {
    return <EmptyState>Nenhum time cadastrado ainda.</EmptyState>;
  }

  return (
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Técnico</th>
            <th className="w-40 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.id} className="border-b border-border last:border-0">
              {editingId === team.id ? (
                <td colSpan={3} className="px-4 py-3">
                  <form
                    action={async (formData) => {
                      await updateTeam(team.id, championshipId, formData);
                      setEditingId(null);
                    }}
                    className="flex flex-wrap items-center gap-2"
                  >
                    <Input
                      name="name"
                      defaultValue={team.name}
                      autoFocus
                      required
                      className="max-w-xs"
                    />
                    <Select
                      name="coach_id"
                      defaultValue={team.coach_id ?? ""}
                      className="max-w-xs"
                    >
                      <option value="">Sem técnico</option>
                      {coaches.map((coach) => (
                        <option key={coach.id} value={coach.id}>
                          {coach.name}
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
                    {team.name}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {coachName(team.coach_id)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setEditingId(team.id)}
                      >
                        Editar
                      </Button>
                      <form
                        action={async () => {
                          if (window.confirm(`Excluir o time "${team.name}"?`)) {
                            await deleteTeam(team.id, championshipId);
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
