"use client";

import { useState } from "react";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { cancelTeamInvite, deleteTeam, inviteTeamOwner, updateTeam } from "./actions";

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
};
type Invite = { id: string; team_id: string; email: string };

export function TeamTable({
  championshipId,
  teams,
  coaches,
  invites,
}: {
  championshipId: string;
  teams: Team[];
  coaches: Coach[];
  invites: Invite[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const coachName = (coachId: string | null) =>
    coaches.find((c) => c.id === coachId)?.name ?? "—";
  const pendingInvite = (teamId: string) =>
    invites.find((invite) => invite.team_id === teamId);

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
            <th className="px-4 py-3">Dono do time</th>
            <th className="w-56 px-4 py-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => {
            const invite = pendingInvite(team.id);
            return (
              <tr key={team.id} className="border-b border-border last:border-0">
                {editingId === team.id ? (
                  <td colSpan={4} className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        try {
                          await updateTeam(team.id, championshipId, formData);
                          setEditingId(null);
                        } catch (error) {
                          alert(errorMessage(error));
                        }
                      }}
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
                      <Input
                        name="crest_url"
                        type="url"
                        defaultValue={team.crest_url ?? ""}
                        placeholder="URL do escudo"
                        className="max-w-[10rem]"
                      />
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
                ) : invitingId === team.id ? (
                  <td colSpan={4} className="px-4 py-3">
                    <form
                      action={async (formData) => {
                        try {
                          await inviteTeamOwner(championshipId, team.id, formData);
                          setInvitingId(null);
                        } catch (error) {
                          alert(errorMessage(error));
                        }
                      }}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <Input
                        name="email"
                        type="email"
                        required
                        placeholder="e-mail do dono do time"
                        className="max-w-xs"
                      />
                      <Button type="submit">Enviar convite</Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setInvitingId(null)}
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
                      {team.owner_user_id ? (
                        <Badge tone="success">Vinculado</Badge>
                      ) : invite ? (
                        <div className="flex items-center gap-2">
                          <Badge tone="warning">Convite enviado: {invite.email}</Badge>
                          <button
                            type="button"
                            className="text-xs text-muted underline hover:text-danger"
                            onClick={async () => {
                              try {
                                await cancelTeamInvite(invite.id, championshipId);
                              } catch (error) {
                                alert(errorMessage(error));
                              }
                            }}
                          >
                            cancelar
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">Sem dono vinculado</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        {!team.owner_user_id && !invite && (
                          <Button
                            variant="secondary"
                            onClick={() => setInvitingId(team.id)}
                          >
                            Convidar dono
                          </Button>
                        )}
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
  );
}
