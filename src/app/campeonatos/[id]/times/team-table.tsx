"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, FileInput, Input, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { deleteTeam, updateTeam } from "./actions";
import { TeamRoster } from "./team-roster";
import { TeamRosterLinkPanel } from "./team-roster-link-panel";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível concluir a ação.";
}

type Coach = { id: string; name: string };
type Team = {
  id: string;
  name: string;
  coach_id: string | null;
  crest_url: string | null;
  owner_user_id: string | null;
  group_name: string | null;
};
type Player = {
  id: string;
  name: string;
  team_id: string | null;
  number: number | null;
  position: string | null;
  document_type: string | null;
  document_number: string | null;
  birth_date: string | null;
};

export function TeamTable({
  championshipId,
  teams,
  coaches,
  players,
  groupLabels,
  showGroups,
}: {
  championshipId: string;
  teams: Team[];
  coaches: Coach[];
  players: Player[];
  groupLabels: string[] | null;
  showGroups: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [linkingId, setLinkingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const coachName = (coachId: string | null) =>
    coaches.find((c) => c.id === coachId)?.name ?? "—";
  const expandedTeam = teams.find((t) => t.id === expandedId) ?? null;

  if (teams.length === 0) {
    return <EmptyState>Nenhum time cadastrado ainda.</EmptyState>;
  }

  return (
    <>
    <Card className="overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">Time</th>
            <th className="px-4 py-3">Grupo</th>
            <th className="px-4 py-3">Técnico</th>
            <th className="px-4 py-3">Dono do time</th>
            <th className="w-56 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            return (
              <tr key={team.id} className="border-b border-border last:border-0">
                {editingId === team.id ? (
                  <td colSpan={5} className="px-4 py-3">
                    <ActionForm
                      action={(formData) => updateTeam(team.id, championshipId, formData)}
                      onSuccess={() => setEditingId(null)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Input
                        name="name"
                        defaultValue={team.name}
                        autoFocus
                        required
                        className="max-w-[10rem]"
                      />
                      <Select
                        name="coach_id"
                        defaultValue={team.coach_id ?? ""}
                        className="max-w-[10rem]"
                      >
                        <option value="">Sem técnico</option>
                        {coaches.map((coach) => (
                          <option key={coach.id} value={coach.id}>
                            {coach.name}
                          </option>
                        ))}
                      </Select>
                      <FileInput name="crest" accept="image/*" className="max-w-[12rem]" />
                      {showGroups &&
                        (groupLabels ? (
                          <Select
                            name="group_name"
                            defaultValue={team.group_name ?? ""}
                            className="max-w-[10rem]"
                          >
                            <option value="">Sem grupo</option>
                            {groupLabels.map((label) => (
                              <option key={label} value={label}>
                                {label}
                              </option>
                            ))}
                          </Select>
                        ) : (
                          <Input
                            name="group_name"
                            defaultValue={team.group_name ?? ""}
                            placeholder="Grupo A"
                            className="max-w-[8rem]"
                          />
                        ))}
                      <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </Button>
                    </ActionForm>
                  </td>
                ) : linkingId === team.id ? (
                  <td colSpan={5} className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <TeamRosterLinkPanel teamId={team.id} />
                      <div>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setLinkingId(null)}
                        >
                          Fechar
                        </Button>
                      </div>
                    </div>
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        {team.crest_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={team.crest_url}
                            alt=""
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : null}
                        {team.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {team.group_name ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {coachName(team.coach_id)}
                    </td>
                    <td className="px-4 py-3">
                      {team.owner_user_id ? (
                        <Badge tone="success">Vinculado</Badge>
                      ) : (
                        <span className="text-muted">Sem dono vinculado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => setExpandedId(team.id)}
                        >
                          Elenco
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setLinkingId(team.id)}
                        >
                          Link do elenco
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => setEditingId(team.id)}
                        >
                          Editar
                        </Button>
                        <form
                          action={async () => {
                            if (window.confirm(`Excluir o time "${team.name}"?`)) {
                              try {
                                await deleteTeam(team.id, championshipId);
                              } catch (error) {
                                alert(errorMessage(error));
                              }
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
            );
          })}
        </tbody>
      </table>
    </Card>

      {expandedTeam && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setExpandedId(null)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-background shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h2 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">
                Elenco · {expandedTeam.name}
              </h2>
              <Button variant="secondary" onClick={() => setExpandedId(null)}>
                Fechar
              </Button>
            </div>
            <div className="overflow-y-auto">
              <TeamRoster
                championshipId={championshipId}
                teamId={expandedTeam.id}
                coachId={expandedTeam.coach_id}
                coaches={coaches}
                players={players.filter((p) => p.team_id === expandedTeam.id)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
