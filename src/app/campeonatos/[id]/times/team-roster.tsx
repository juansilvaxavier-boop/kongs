"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge, Button, Card, FileInput, Input, Label, Select } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { useConfirm } from "@/components/confirm-provider";
import { useToast } from "@/components/toast-provider";
import { PLAYER_POSITIONS } from "@/lib/positions";
import {
  createPlayer,
  deletePlayer,
  setOrCreateTeamCoach,
  updatePlayer,
} from "./actions";

const DOCUMENT_LABELS: Record<string, string> = { cpf: "CPF", rg: "RG" };

type Coach = { id: string; name: string };
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

export function TeamRoster({
  championshipId,
  teamId,
  coachId,
  coaches,
  players,
}: {
  championshipId: string;
  teamId: string;
  coachId: string | null;
  coaches: Coach[];
  players: Player[];
}) {
  const [creatingCoach, setCreatingCoach] = useState(false);
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const confirm = useConfirm();
  const toast = useToast();
  const router = useRouter();

  async function handleDeletePlayer(player: Player) {
    const ok = await confirm({
      title: `Excluir o jogador "${player.name}"?`,
      confirmLabel: "Excluir",
      danger: true,
    });
    if (!ok) return;
    const result = await deletePlayer(player.id, championshipId);
    if (!result.ok) {
      toast.error(result.error);
    } else {
      router.refresh();
    }
  }

  return (
    <div className="space-y-5 border-t border-border bg-surface-2/40 p-4">
      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Técnico
        </h3>
        <ActionForm
          action={(formData) => setOrCreateTeamCoach(teamId, championshipId, formData)}
          onSuccess={() => setCreatingCoach(false)}
          className="flex flex-wrap items-center gap-2"
        >
          {creatingCoach ? (
            <>
              <Input
                name="new_coach_name"
                required
                autoFocus
                placeholder="Nome do novo técnico"
                className="max-w-[12rem]"
              />
              <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreatingCoach(false)}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Select name="coach_id" defaultValue={coachId ?? ""} className="max-w-[12rem]">
                <option value="">Sem técnico</option>
                {coaches.map((coach) => (
                  <option key={coach.id} value={coach.id}>
                    {coach.name}
                  </option>
                ))}
              </Select>
              <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setCreatingCoach(true)}
              >
                + Novo técnico
              </Button>
            </>
          )}
        </ActionForm>
      </div>

      <div>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          Jogadores
        </h3>

        <ActionForm
          action={(formData) => createPlayer(championshipId, teamId, formData)}
          className="mb-3 flex flex-wrap items-end gap-2"
        >
          <div className="flex-1 basis-32">
            <Label>Nome</Label>
            <Input name="name" required placeholder="Nome do jogador" />
          </div>
          <div className="w-20">
            <Label>Nº</Label>
            <Input name="number" type="number" placeholder="Nº" />
          </div>
          <div className="flex-1 basis-32">
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
          <div className="w-40">
            <Label>Data de nascimento</Label>
            <Input name="birth_date" type="date" required />
          </div>
          <div className="w-28">
            <Label>Documento</Label>
            <Select name="document_type" defaultValue="">
              <option value="">Nenhum</option>
              <option value="cpf">CPF</option>
              <option value="rg">RG</option>
            </Select>
          </div>
          <div className="flex-1 basis-32">
            <Label>Nº do documento</Label>
            <Input name="document_number" placeholder="Nº do documento" />
          </div>
          <div className="flex-1 basis-40">
            <Label>Foto</Label>
            <FileInput name="photo" accept="image/*" />
          </div>
          <SubmitButton pendingText="Adicionando…">Adicionar</SubmitButton>
        </ActionForm>

        {players.length === 0 ? (
          <p className="text-sm text-muted">Nenhum jogador cadastrado ainda.</p>
        ) : (
          <Card className="overflow-x-auto">
            <table className="w-full min-w-[42rem] text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-2/60 text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-3 py-2">Jogador</th>
                  <th className="px-3 py-2">Nº</th>
                  <th className="px-3 py-2">Posição</th>
                  <th className="px-3 py-2">Documento</th>
                  <th className="w-36 px-3 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="border-b border-border last:border-0">
                    {editingPlayerId === player.id ? (
                      <td colSpan={5} className="px-3 py-2">
                        <ActionForm
                          action={(formData) => updatePlayer(player.id, championshipId, formData)}
                          onSuccess={() => setEditingPlayerId(null)}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Input
                            name="name"
                            defaultValue={player.name}
                            autoFocus
                            required
                            className="max-w-[10rem]"
                          />
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
                          <Input
                            name="birth_date"
                            type="date"
                            defaultValue={player.birth_date ?? ""}
                            required
                            className="max-w-[10rem]"
                          />
                          <Select
                            name="document_type"
                            defaultValue={player.document_type ?? ""}
                            className="max-w-[7rem]"
                          >
                            <option value="">Nenhum</option>
                            <option value="cpf">CPF</option>
                            <option value="rg">RG</option>
                          </Select>
                          <Input
                            name="document_number"
                            defaultValue={player.document_number ?? ""}
                            placeholder="Nº do documento"
                            className="max-w-[9rem]"
                          />
                          <FileInput name="photo" accept="image/*" className="max-w-[10rem]" />
                          <SubmitButton pendingText="Salvando…">Salvar</SubmitButton>
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setEditingPlayerId(null)}
                          >
                            Cancelar
                          </Button>
                        </ActionForm>
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2 font-medium text-foreground">
                          {player.name}
                        </td>
                        <td className="px-3 py-2 text-muted">{player.number ?? "—"}</td>
                        <td className="px-3 py-2">
                          {player.position ? (
                            <Badge>{player.position}</Badge>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-muted">
                          {player.document_type
                            ? `${DOCUMENT_LABELS[player.document_type] ?? player.document_type}: ${player.document_number}`
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="secondary"
                              onClick={() => setEditingPlayerId(player.id)}
                            >
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="danger"
                              onClick={() => handleDeletePlayer(player)}
                            >
                              Excluir
                            </Button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </div>
    </div>
  );
}
